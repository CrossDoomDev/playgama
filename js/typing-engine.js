'use strict';
(function(G){
G.TypingEngine=class{
constructor(text,now=()=>performance.now()){this.text=text;this.now=now;this.position=0;this.errors=0;this.attempts=0;this.correct=0;this.combo=0;this.bestCombo=0;this.events=[];this.startAt=null;this.pauseAt=null;this.pausedMs=0;this.lastAt=null;this.bad=false;this.wrongKey='';this.done=false;}
elapsed(){if(this.startAt===null)return 0;return Math.max(0,(this.pauseAt??this.now())-this.startAt-this.pausedMs);}
pause(){if(this.pauseAt===null)this.pauseAt=this.now();}
resume(){if(this.pauseAt!==null){if(this.startAt!==null)this.pausedMs+=this.now()-this.pauseAt;this.pauseAt=null;this.lastAt=null;}}
input(key){if(this.done||this.pauseAt!==null)return null;
if(key==='Backspace'){if(this.bad){this.bad=false;this.wrongKey='';return {backspace:true};}if(this.position>0){this.position--;this.combo=0;}return {backspace:true};}
if(key.length!==1)return null;
const now=this.now();if(this.startAt===null)this.startAt=now;
const expected=this.text[this.position],correct=key===expected;
this.events.push({expected,correct,ms:this.lastAt===null?null:Math.min(10000,now-this.lastAt)});this.lastAt=now;this.attempts++;
if(correct){this.position++;this.correct++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.bad=false;this.wrongKey='';}
else{this.errors++;this.combo=0;this.bad=true;this.wrongKey=key;}
this.done=this.position===this.text.length;
return {correct,expected,done:this.done};
}
result(){return {complete:this.done,accuracy:this.attempts?100*this.correct/this.attempts:100,speed:this.startAt===null?0:Math.round(this.position*60000/Math.max(1000,this.elapsed())),errors:this.errors,correct:this.correct,bestCombo:this.bestCombo,events:this.events,seconds:this.elapsed()/1000};}
};
})(EditorGame);