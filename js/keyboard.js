'use strict';
(function(G){
const rows=[
[['ё','Backquote'],['1','Digit1'],['2','Digit2'],['3','Digit3'],['4','Digit4'],['5','Digit5'],['6','Digit6'],['7','Digit7'],['8','Digit8'],['9','Digit9'],['0','Digit0'],['-','Minus'],['=','Equal'],['Backspace','Backspace',2]]
];
const letters=[['йцукенгшщзхъ',['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight']],['фывапролджэ',['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote']],['ячсмитьбю.',['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash']]];
rows.push([['Tab','Tab',1.5],...[...letters[0][0]].map((k,i)=>[k,letters[0][1][i]]),['\\','Backslash',1.5]]);
rows.push([['Caps Lock','CapsLock',1.8],...[...letters[1][0]].map((k,i)=>[k,letters[1][1][i]]),['Enter','Enter',2.2]]);
rows.push([['Shift','ShiftLeft',2.4],...[...letters[2][0]].map((k,i)=>[k,letters[2][1][i]]),['Shift','ShiftRight',2.6]]);
rows.push([['Ctrl','ControlLeft',1.5],['Alt','AltLeft',1.5],[' ','Space',8],['Alt','AltRight',1.5],['Ctrl','ControlRight',1.5]]);
const groups={'left-pinky':'ё1йфя','left-ring':'2цыч','left-middle':'3увс','left-index':'45кеапми','right-index':'67нгроть','right-middle':'8шлб','right-ring':'9щдю','right-pinky':'0-зхъжэ.=\\'};
const shifted={'!':'1','"':'2','№':'3',';':'4','%':'5',':':'6','?':'7','*':'8','(':'9',')':'0','_':'-','+':'=',',':'.','/':'\\'};
const codeFingers={Tab:'left-pinky',CapsLock:'left-pinky',ShiftLeft:'left-pinky',ShiftRight:'right-pinky',Backspace:'right-pinky',Enter:'right-pinky',Space:'right-thumb',ControlLeft:'left-pinky',ControlRight:'right-pinky',AltLeft:'left-thumb',AltRight:'right-thumb'};
for(const row of rows)for(const [key,code]of row){
 const finger=Object.keys(groups).find(id=>groups[id].includes(key));
 if(finger)codeFingers[code]=finger;
}
const names={'left-pinky':'Левый мизинец','left-ring':'Левый безымянный','left-middle':'Левый средний','left-index':'Левый указательный','left-thumb':'Левый большой палец','right-index':'Правый указательный','right-middle':'Правый средний','right-ring':'Правый безымянный','right-pinky':'Правый мизинец','right-thumb':'Большой палец'};
G.Keyboard=class{
constructor(root,settings={}){
 this.root=root;this.keys={};this.codes={};this.pressTimers=new Map();this.disposed=false;
 root.innerHTML='<div class="keyboard-case"></div><div class="hands"></div>';
 const box=root.firstElementChild;
 for(const row of rows){
  const div=document.createElement('div');div.className='keyrow';
  for(const [key,code,width=1]of row){
   const el=document.createElement('div');el.className='key';el.style.flex=width;el.textContent=key===' '?'Пробел':key;el.dataset.code=code;el.dataset.finger=codeFingers[code];
   if(code==='Backspace'){el.textContent='⌫';el.title='Backspace';el.setAttribute('aria-label','Backspace');}
   if('ао'.includes(key))el.classList.add('home-key');
   this.keys[key]=el;this.codes[code]=el;div.append(el);
  }
  box.append(div);
 }
 this.hands=new G.Hands(root.lastElementChild,settings.hands,settings.handSkin);
 this.setFingerColors(settings.fingerColors);
}
setFingerColors(enabled){this.root.classList.toggle('finger-colors',enabled===true);}
base(char){return shifted[char]||char?.toLowerCase();}
finger(char,code){
 // Physical key codes distinguish left/right modifiers and stay correct in another layout.
 const key=this.codes[code]||this.codes[char]||this.keys[this.base(char)];
 return key?codeFingers[key.dataset.code]||null:null;
}
target(char,allowed=''){
 if(this.disposed)return '';
 for(const el of Object.values(this.codes)){
  el.classList.remove('target','shift-target');
  const k=el.textContent.toLowerCase();el.classList.toggle('unlearned',k.length===1&&!allowed.includes(k));
 }
 const key=this.codes[char]||this.keys[this.base(char)],finger=this.finger(char);
 if(!key||!finger){this.hands.clear();return '';}
 key.classList.add('target');
 const shift=char.length===1&&(char!==char.toLowerCase()||Object.prototype.hasOwnProperty.call(shifted,char));
 const modifierTargets=[];
 if(shift){
  const side=finger.startsWith('left')?'right':'left';
  const modifier=this.codes[side==='right'?'ShiftRight':'ShiftLeft'];
  modifier.classList.add('shift-target');modifierTargets.push({id:side+'-pinky',key:modifier});
 }
 this.hands.target(finger,key,this.keys,modifierTargets);
 return names[finger]+(shift?' + противоположный Shift':'');
}
press(code,char){
 if(this.disposed)return;
 const key=this.codes[code]||this.codes[char]||this.keys[this.base(char)];
 if(!key)return;
 const finger=codeFingers[key.dataset.code];if(!finger)return;
 const timerCode=key.dataset.code;
 clearTimeout(this.pressTimers.get(timerCode));
 key.classList.add('pressed');this.hands.place(finger,key,true);
 // A short pulse also releases keys if focus is lost and no keyup event arrives.
 this.pressTimers.set(timerCode,setTimeout(()=>{
  key.classList.remove('pressed');this.pressTimers.delete(timerCode);
 },120));
}
clear(){
 for(const timer of this.pressTimers.values())clearTimeout(timer);
 this.pressTimers.clear();
 for(const el of Object.values(this.codes))el.classList.remove('pressed');
 this.hands.clear();
}
dispose(){
 if(this.disposed)return;
 this.clear();this.hands.dispose();this.disposed=true;
}
};
})(EditorGame);
