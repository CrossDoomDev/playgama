'use strict';
(function(G){
const KEY='newsEditorProgress',BOARD='editorExperience';
const wait=p=>Promise.race([Promise.resolve(p),new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),7000))]);
const decode=value=>{
 if(Array.isArray(value))value=value[0];
 if(value&&typeof value==='object'&&Object.prototype.hasOwnProperty.call(value,KEY))value=value[KEY];
 if(typeof value==='string'){try{return JSON.parse(value);}catch{return null;}}
 return value&&typeof value==='object'?value:null;
};
G.PlaygamaProgress=class{
 constructor(game){
  this.game=game;this.loaded=false;this.dirty=false;this.timer=null;this.sending=null;
  this.lastWrite=0;this.lastScore=-1;this.scoreBusy=false;this.lastScoreAt=0;
  this.message='Прогресс сохраняется в браузере.';this.entries=null;this.entriesAt=0;
 }
 status(){return this.message;}
 storage(){return this.game.sdk.sdk?.storage;}
 board(){return this.game.sdk.sdk?.leaderboards;}
 async init(local){
  if(!this.game.sdk.isAvailable||!this.storage()?.get||this.game.development())return;
  try{
   const remote=decode(await wait(this.storage().get(KEY)));
   if(remote?.version===1&&(Number(remote.updatedAt)||0)>(Number(local.updatedAt)||0)){
    this.game.s=G.Save.load(remote);
    G.Energy.recover(this.game.s);G.Daily.refresh(this.game.s);
    G.Save.write(this.game.s);
   }
   this.loaded=true;
   this.message='Синхронизация Playgama Bridge включена. Прогресс также сохраняется в браузере.';
   this.queue();void this.submitScore();
  }catch(error){
   this.loaded=false;
   this.message='Облако Playgama недоступно. Локальный прогресс сохранён.';
  }
 }
 queue(){
  if(!this.loaded)return;
  this.dirty=true;
  if(!this.timer)this.timer=setTimeout(()=>{this.timer=null;void this.flush();},8000);
 }
 async flush(){
  if(!this.loaded||!this.dirty)return false;
  if(this.sending){await this.sending;return this.flush();}
  clearTimeout(this.timer);this.timer=null;
  const waitFor=Math.max(0,4000-(Date.now()-this.lastWrite));
  if(waitFor){this.timer=setTimeout(()=>{this.timer=null;void this.flush();},waitFor);return false;}
  const snapshot=JSON.parse(JSON.stringify(this.game.s));
  const payload=JSON.stringify(snapshot);
  if(new TextEncoder().encode(payload).length>180000){
   this.message='Прогресс слишком большой для облака. Локальное сохранение осталось.';return false;
  }
  this.dirty=false;this.lastWrite=Date.now();
  this.sending=(async()=>{
   try{
    await wait(this.storage().set(KEY,payload));
    this.message='Прогресс сохранён через Playgama Bridge.';return true;
   }catch(error){
    this.dirty=true;this.message='Синхронизация недоступна; локальная копия сохранена.';return false;
   }
  })();
  const result=await this.sending;this.sending=null;
  if(this.dirty)this.queue();return result;
 }
 async submitScore(){
  const board=this.board(),score=Math.max(0,Math.floor(this.game.s.xp));
  if(!this.game.sdk.isAvailable||!board||board.type==='not_available'||!board.setScore||
     this.scoreBusy||score===this.lastScore||Date.now()-this.lastScoreAt<1100)return false;
  this.scoreBusy=true;this.lastScoreAt=Date.now();
  try{await wait(board.setScore(BOARD,score));this.lastScore=score;return true;}
  catch{return false;}finally{this.scoreBusy=false;}
 }
 async authorize(){
  const g=this.game,player=g.sdk.sdk?.player;
  if(g.engine&&!g.engine.done){G.UI.toast('Сначала заверши задание, чтобы войти.');return;}
  if(!player?.isAuthorizationSupported||!player.authorize){G.UI.toast('Вход на этой площадке недоступен.');return;}
  g.pause('auth');
  try{
   await wait(player.authorize({}));
   this.loaded=false;await this.init(JSON.parse(JSON.stringify(g.s)));
   G.Cosmetics.apply(g.s);g.audio.settings=g.s.settings;
   g.scene();G.UI.toast(this.status());
  }catch{G.UI.toast('Авторизация отменена. Можно продолжить без входа.');}
  finally{g.resume('auth');g.settings();}
 }
 async showLeaderboard(){
  const g=this.game,U=G.UI,board=this.board();
  if(g.engine&&!g.engine.done)g.pause('menu');
  const close=()=>g.closeMenu();
  const authorized=g.sdk.sdk?.player?.isAuthorized===true;
  const canAuth=!!g.sdk.sdk?.player?.isAuthorizationSupported;
  const actions=[{label:'Вернуться к игре',primary:true,run:close}];
  if(canAuth)actions.push({label:'Войти через площадку',run:()=>this.authorize()});
  U.modal('Рейтинг редакторов','<p>Общий опыт за практику и опубликованные новости.</p><div id="leaderboard-content" aria-live="polite">Загрузка рейтинга…</div>',actions);
  const target=document.querySelector('#leaderboard-content');
  try{
   if(!board||board.type==='not_available')throw Error('unavailable');
   await this.submitScore();
   if(board.type==='native_popup'&&board.showNativePopup){await board.showNativePopup(BOARD);if(target?.isConnected)target.textContent='Рейтинг открыт на площадке.';return;}
   if(!board.getEntries)throw Error('unavailable');
   if(!this.entries||Date.now()-this.entriesAt>30000){this.entries=await wait(board.getEntries(BOARD));this.entriesAt=Date.now();}
   if(!target?.isConnected)return;
   const entries=Array.isArray(this.entries)?this.entries:this.entries?.entries||[];
   const rank=this.entries?.userRank;
   target.innerHTML=(rank?'<p>Твоё место: <strong>'+U.escape(String(rank))+'</strong></p>':'')+
    (entries.length?'<table class="leaderboard-table"><thead><tr><th>Место</th><th>Редактор</th><th>Опыт</th></tr></thead><tbody>'+entries.map((entry,index)=>
     '<tr><td>'+U.escape(String(entry.rank??index+1))+'</td><td>'+U.escape(G.I18n.userText(String(entry.name||'Игрок')))+'</td><td>'+U.escape(String(entry.score??0))+'</td></tr>').join('')+'</tbody></table>':'<p>Пока нет результатов. Стань первым редактором!</p>')+
    (!authorized&&canAuth?'<p>Авторизуйся, чтобы участвовать в общем рейтинге.</p>':'');
  }catch{if(target?.isConnected)target.innerHTML='<p>Рейтинг пока недоступен. Прогресс игры сохранён.</p>';}
 }
};
})(EditorGame);
