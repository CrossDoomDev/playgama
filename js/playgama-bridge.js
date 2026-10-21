'use strict';
(function(G){
// Platform adapter: all Playgama Bridge access lives here. The game must
// remain playable offline; offline mode NEVER pretends an ad was rewarded.
const now=()=>Date.now();
const adError=error=>console.warn('[Playgama Bridge] Advertisement unavailable:',error);
G.BridgeService=class{
 constructor(){
  this.sdk=null;this.playing=false;this.isReady=false;this.isAvailable=false;this.busy=false;
  this.language=globalThis.navigator?.language||'ru';
  this.local=location.protocol==='file:'||['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  this.pause=()=>{};this.resume=()=>{};this.audioEnabled=true;this.onAudioChange=()=>{};
  this.lastAdAt=0;this.completedSinceAd=0;this.activeAd=null;this.bannerVisible=false;
 }
 async init(){
  const sdk=globalThis.bridge;
  if(!sdk||typeof sdk.initialize!=='function'){
   console.info('[Playgama Bridge] SDK not loaded; local save mode.');return;
  }
  try{
   await Promise.race([sdk.initialize(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Bridge initialization timed out')),7000))]);
   this.sdk=sdk;
   const platform=sdk.platform;
   this.isAvailable=!!platform&&!['mock','standalone'].includes(String(platform.id||'').toLowerCase());
   this.language=platform?.language||this.language;
   this.audioEnabled=platform?.isAudioEnabled!==false;this.onAudioChange(this.audioEnabled);
   this.message('in_game_loading_started');
   const event=sdk.EVENT_NAME||{};
   if(platform?.on&&event.PAUSE_STATE_CHANGED)platform.on(event.PAUSE_STATE_CHANGED,paused=>{
    if(paused)this.pause('platform');else this.resume('platform');
   });
   if(platform?.on&&event.AUDIO_STATE_CHANGED)platform.on(event.AUDIO_STATE_CHANGED,enabled=>{
    this.audioEnabled=enabled!==false;this.onAudioChange(this.audioEnabled);
   });
  }catch(error){
   console.warn('[Playgama Bridge] Initialization failed; browser save remains available.',error);
  }
 }
 message(name){
  try{const pending=this.sdk?.platform?.sendMessage?.(name);
   if(pending&&typeof pending.catch==='function')pending.catch(error=>console.debug('[Bridge] message:',name,error));
  }catch(error){console.debug('[Bridge] message:',name,error);}
 }
 ready(){if(this.isReady)return;this.isReady=true;this.message('in_game_loading_stopped');this.message('game_ready');void this.showBanner();}
 start(){if(this.playing)return;this.playing=true;this.message('gameplay_started');void this.hideBanner();}
 stop(){if(!this.playing)return;this.playing=false;this.message('gameplay_stopped');if(!this.busy)void this.showBanner();}
 async showBanner(){
  const ads=this.sdk?.advertisement;
  if(!this.isAvailable||!ads?.isBannerSupported||this.playing||this.busy)return false;
  try{await ads.showBanner('bottom','menu');this.bannerVisible=true;return true;}
  catch(error){adError(error);return false;}
 }
 async hideBanner(){
  if(!this.bannerVisible)return;
  this.bannerVisible=false;
  try{await this.sdk?.advertisement?.hideBanner?.();}catch(error){adError(error);}
 }
 canReward(){return this.local&&!this.isAvailable||!!(this.isAvailable&&this.sdk?.advertisement?.isRewardedSupported);}
 completed(){this.completedSinceAd++;}
 betweenTasks(){return this.fullscreen();}
 async rewarded(grant,simulate){
  if(this.busy)return false;
  if(!this.isAvailable){
   if(this.local&&typeof simulate==='function'){
    this.busy=true;this.pause('advert');
    try{const approved=await simulate();if(approved){grant();return true;}return false;}
    finally{this.busy=false;this.resume('advert');}
   }
   return false;
  }
  const ads=this.sdk?.advertisement;
  if(!ads?.isRewardedSupported||typeof ads.showRewarded!=='function')return false;
  this.busy=true;this.pause('advert');await this.hideBanner();
  try{
   return await new Promise(resolve=>{
    let finished=false,rewarded=false;
    const events=this.sdk.EVENT_NAME||{};
    // Promise resolution is NOT proof that a reward was earned.
    // Only REWARDED_STATE_CHANGED('rewarded') may grant a reward.
    const finish=success=>{
     if(finished)return;finished=true;clearTimeout(timeout);
     this.activeAd=null;
     try{ads.off?.(events.REWARDED_STATE_CHANGED,onState);}catch{}
     resolve(success===true);
    };
    const onState=state=>{
     if(finished)return;
     if(state==='opened')this.pause('advert');
     if(state==='rewarded'){
      if(!rewarded){rewarded=true;try{grant();}catch(error){console.error(error);}}
      // Keep the game paused until the advertisement actually closes.
     }
     else if(state==='closed'||state==='failed')finish(rewarded);
    };
    const timeout=setTimeout(()=>finish(rewarded),90000);
    this.activeAd=onState;
    // Install a one-time listener per call. No late event from a previous ad
    // is allowed to grant a reward; old handlers exit when finished.
    if(ads.on&&events.REWARDED_STATE_CHANGED){
     ads.on(events.REWARDED_STATE_CHANGED,onState);
    }else{finish(false);return;}
    Promise.resolve().then(()=>ads.showRewarded('energy_or_double_reward'))
     .catch(error=>{adError(error);finish(false);});
   });
  }catch(error){adError(error);return false;}
  finally{this.lastAdAt=now();this.busy=false;this.resume('advert');if(!this.playing)void this.showBanner();}
 }
 async fullscreen(){
  const ads=this.sdk?.advertisement;
  if(!this.isAvailable||this.busy||!ads?.isInterstitialSupported||typeof ads.showInterstitial!=='function')return false;
  // Respect user experience and common platform cooldowns, independently of SDK.
  if(this.lastAdAt&&now()-this.lastAdAt<60000)return false;
  this.busy=true;this.pause('advert');await this.hideBanner();
  try{
   return await new Promise(resolve=>{
    let finished=false,opened=false;
    const events=this.sdk.EVENT_NAME||{};
    const finish=ok=>{if(finished)return;finished=true;clearTimeout(timeout);
     try{ads.off?.(events.INTERSTITIAL_STATE_CHANGED,onState);}catch{}resolve(ok);};
    const onState=state=>{
     if(finished)return;
     if(state==='opened')opened=true;
     if(state==='closed')finish(opened);
     if(state==='failed')finish(false);
    };
    const timeout=setTimeout(()=>finish(false),90000);
    if(ads.on&&events.INTERSTITIAL_STATE_CHANGED){ads.on(events.INTERSTITIAL_STATE_CHANGED,onState);}
    else{finish(false);return;}
    Promise.resolve().then(()=>ads.showInterstitial('task_complete'))
     .catch(error=>{adError(error);finish(false);});
   });
  }catch(error){adError(error);return false;}
  finally{this.lastAdAt=now();this.busy=false;this.resume('advert');if(!this.playing)void this.showBanner();}
 }
};
})(EditorGame);
