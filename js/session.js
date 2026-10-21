'use strict';
(function(G){
G.Session={
capture(task,e){return {kind:task.kind,id:task.kind==='news'?task.news.id:task.lesson.id,text:e.text,position:e.position,errors:e.errors,attempts:e.attempts,correct:e.correct,combo:e.combo,bestCombo:e.bestCombo,events:e.events,elapsed:e.elapsed(),started:e.startAt!==null,bad:e.bad,wrongKey:e.wrongKey};},
task(s,c){
if(!c||!['lesson','news'].includes(c.kind)||typeof c.text!=='string'||c.text.length>10000)return null;
for(const k of ['position','errors','attempts','correct','combo','bestCombo','elapsed'])if(!Number.isFinite(c[k])||c[k]<0)return null;
if(c.position>=c.text.length||!Number.isInteger(c.position)||!Array.isArray(c.events)||c.events.length>20000||!c.events.every(e=>e&&typeof e.expected==='string'&&typeof e.correct==='boolean'))return null;
if(c.kind==='news'){const news=G.data.news[c.id];return news&&news.text===c.text&&G.Progress.canNews(s,news)?{kind:'news',news,text:c.text}:null;}
const lesson=G.data.lessons[c.id];return lesson&&lesson.id<=s.lesson&&[...c.text].every(k=>lesson.keys.includes(k.toLowerCase()))?{kind:'lesson',lesson,text:c.text}:null;
},
restore(e,c){for(const k of ['position','errors','attempts','correct','combo','bestCombo'])e[k]=c[k];e.events=c.events;e.bad=c.bad===true;e.wrongKey=typeof c.wrongKey==='string'?c.wrongKey:'';e.startAt=c.started?e.now()-c.elapsed:null;}
};
})(EditorGame);
