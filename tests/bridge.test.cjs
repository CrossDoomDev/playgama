const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const directory=path.resolve(__dirname,'..');
async function run(){
 const G={};
 const events={},storage=new Map();
 const progress={version:1,updatedAt:1700000000000,xp:55,coins:30,energy:6};
 let rewardShows=0,interstitialShows=0;
 const ads={isBannerSupported:true,isRewardedSupported:true,isInterstitialSupported:true,
  on(event,cb){(events[event]??=[]).push(cb);},
  off(event,cb){events[event]=events[event]?.filter(v=>v!==cb)||[];},
  emit(event,state){for(const fn of events[event]||[])fn(state);},
  showBanner(){return Promise.resolve();},hideBanner(){return Promise.resolve();},
  showRewarded(){rewardShows++;return Promise.resolve();},
  showInterstitial(){interstitialShows++;return Promise.resolve();}
 };
 const messages=[];
 const bridge={EVENT_NAME:{PAUSE_STATE_CHANGED:'pause',AUDIO_STATE_CHANGED:'audio',REWARDED_STATE_CHANGED:'rewarded',INTERSTITIAL_STATE_CHANGED:'interstitial'},
  initialize:async()=>{},advertisement:ads,
  platform:{id:'playgama',language:'en',on(){},sendMessage:msg=>messages.push(msg)},
  player:{isAuthorized:true,isAuthorizationSupported:true,authorize:()=>Promise.resolve()},
  storage:{get:async key=>storage.get(key)||null,set:async(key,value)=>{storage.set(key,value);}},
  leaderboards:{type:'in_game',setScore:async()=>{},getEntries:async()=>[{rank:1,name:'Writer',score:55}]}
 };
 const context=vm.createContext({EditorGame:G,bridge,location:{protocol:'https:',hostname:'playgama.com'},navigator:{language:'ru'},console,
  window:{},Date,Promise,setTimeout,clearTimeout,TextEncoder});
 const evaluate=file=>vm.runInContext(fs.readFileSync(path.join(directory,'js',file),'utf8'),context,{filename:file});
 evaluate('playgama-bridge.js');evaluate('playgama-progress.js');
 const service=new G.BridgeService();await service.init();
 assert.equal(service.isAvailable,true);assert.equal(service.language,'en');
 let paused=0,resumed=0;service.pause=()=>paused++;service.resume=()=>resumed++;
 service.ready();assert(messages.includes('game_ready'));assert(messages.includes('in_game_loading_stopped'));
 service.start();assert(messages.includes('gameplay_started'));service.stop();
 assert(messages.includes('gameplay_stopped'));
 let grant=0;
 const rejected=service.rewarded(()=>grant++);
 await new Promise(resolve=>setTimeout(resolve,10));
 ads.emit('rewarded','opened');ads.emit('rewarded','closed');
 assert.equal(await rejected,false);assert.equal(grant,0,'closing ad cannot grant reward');
 const rewarded=service.rewarded(()=>grant++);
 await new Promise(resolve=>setTimeout(resolve,10));
 ads.emit('rewarded','opened');ads.emit('rewarded','rewarded');ads.emit('rewarded','closed');
 assert.equal(await rewarded,true);assert.equal(grant,1,'grants only when SDK confirms reward');
 assert.equal(rewardShows,2);
 service.lastAdAt=0;
 const inter=service.fullscreen();
 await new Promise(resolve=>setTimeout(resolve,10));
 ads.emit('interstitial','opened');ads.emit('interstitial','closed');
 assert.equal(await inter,true);assert.equal(interstitialShows,1);
 assert.equal(await service.fullscreen(),false,'enforces ad cooldown');
 assert(paused>0&&resumed>0);
 const localSave={version:1,updatedAt:1600000000000,xp:5,coins:2};
 storage.set('newsEditorProgress',JSON.stringify(progress));
 const game={s:{...localSave},sdk:service,development:()=>false};
 G.Save={load:s=>s,write(){} };G.Energy={recover(){}};G.Daily={refresh(){}};
 const cloud=new G.PlaygamaProgress(game);await cloud.init(localSave);
 assert.equal(game.s.coins,30,'newer cloud save should take precedence over local');
 game.s.coins=37;cloud.queue();clearTimeout(cloud.timer);cloud.timer=null;
 cloud.lastWrite=Date.now()-5000;
 assert.equal(await cloud.flush(),true);
 assert.equal(JSON.parse(storage.get('newsEditorProgress')).coins,37);
 // Offline mode must never silently award paid rewards.
 const offlineContext=vm.createContext({EditorGame:{},location:{protocol:'https:',hostname:'example.org'},navigator:{language:'ru'},console,
  window:{},Date,Promise,setTimeout,clearTimeout,TextEncoder});
 vm.runInContext(fs.readFileSync(path.join(directory,'js','playgama-bridge.js'),'utf8'),offlineContext);
 const offline=new offlineContext.EditorGame.BridgeService();await offline.init();
 let freeReward=0;assert.equal(await offline.rewarded(()=>freeReward++),false);assert.equal(freeReward,0);
 console.log('PASS: Bridge lifecycle, advertised ads, verified reward, cooldown, saved cloud state and offline fallback.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
