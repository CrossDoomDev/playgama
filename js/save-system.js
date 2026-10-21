'use strict';
(function(G){
const KEY='news-editor-save-v1';
const DEVELOPMENT_KEY='news-editor-development-save-v1';
const fresh=()=>({version:1,updatedAt:0,xp:0,coins:0,energy:G.Energy.MAX,energyAt:Date.now(),streak:0,lastPractice:'',giftDate:'',giftIndex:0,lesson:0,passes:{},mastery:{},achievements:[],owned:[],keyboard:'classic',theme:'default',handSkin:'default',avatar:'default',settings:{music:true,sound:true,hands:.38,fingerColors:false},archive:[],intro:false,office:false,career:0,careerSceneSeen:0,endingSeen:false,perfect:false,purchases:0,totalChars:0,totalTasks:0,newsCount:0,bestCombo:0,bestSpeed:0,successRun:0,daily:{date:'',tasks:0,chars:0,news:0,claimed:false},lastReward:null,checkpoint:{}});
G.Save={
fresh,warning:'',
key:()=>G.Development?.enabled?DEVELOPMENT_KEY:KEY,
load(override){try{const activeKey=this.key();let raw=override===undefined?localStorage.getItem(activeKey):JSON.stringify(override);if(raw===null&&activeKey!==KEY)raw=localStorage.getItem(KEY);if(!raw)return fresh();const s=JSON.parse(raw);if(!s||s.version!==1)throw Error('version');const b=fresh();for(const k of Object.keys(b)){if(s[k]!==undefined&&typeof s[k]===typeof b[k])b[k]=s[k];}
for(const k of ['xp','coins','energy','energyAt','streak','giftIndex','lesson','totalChars','totalTasks','newsCount','bestCombo','bestSpeed','successRun'])if(!Number.isFinite(b[k])||b[k]<0)b[k]=fresh()[k];
b.energy=Math.min(G.Energy.MAX,b.energy);b.lesson=Math.min(25,Math.floor(b.lesson));
for(const k of ['owned','archive','achievements'])if(!Array.isArray(b[k]))b[k]=[];
for(const k of ['passes','mastery','daily','settings'])if(!b[k]||typeof b[k]!=='object'||Array.isArray(b[k]))b[k]=fresh()[k];
b.settings={...fresh().settings,...b.settings};b.settings.fingerColors=b.settings.fingerColors===true;G.Cosmetics.normalize(b);b.career=Number.isFinite(s.career)?Math.max(b.office?1:0,Math.min(2,Math.floor(s.career))):(b.office?1:0);b.careerSceneSeen=Number.isFinite(s.careerSceneSeen)?Math.max(0,Math.min(b.career,Math.floor(s.careerSceneSeen))):(b.office?1:0);b.office=b.career>0;return b;
}catch(e){this.warning='Сохранение недоступно или повреждено. Игра работает, но прогресс может не сохраниться.';return fresh();}},
reset(){
const keys=[KEY,DEVELOPMENT_KEY],previous=new Map();
try{
for(const key of keys)previous.set(key,localStorage.getItem(key));
const state=fresh();
localStorage.setItem(KEY,JSON.stringify(state));
localStorage.removeItem(DEVELOPMENT_KEY);
this.warning='';return state;
}catch(e){
for(const [key,value] of previous){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{}}
this.warning='Не удалось сбросить сохранение. Разреши хранение данных для этой страницы и попробуй снова.';
return null;
}},
write(s){s.updatedAt=Date.now();try{localStorage.setItem(this.key(),JSON.stringify(s));return true;}catch{this.warning='Браузер запретил сохранение. Разреши хранение данных для этой страницы.';return false;}}
};
})(EditorGame);