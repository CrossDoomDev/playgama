'use strict';
(function(G){
const Base=G.Keyboard;
const layout={Backquote:'`',KeyQ:'q',KeyW:'w',KeyE:'e',KeyR:'r',KeyT:'t',KeyY:'y',KeyU:'u',KeyI:'i',KeyO:'o',KeyP:'p',BracketLeft:'[',BracketRight:']',KeyA:'a',KeyS:'s',KeyD:'d',KeyF:'f',KeyG:'g',KeyH:'h',KeyJ:'j',KeyK:'k',KeyL:'l',Semicolon:';',Quote:"'",KeyZ:'z',KeyX:'x',KeyC:'c',KeyV:'v',KeyB:'b',KeyN:'n',KeyM:'m',Comma:',',Period:'.',Slash:'/'};
const shifted={'!':'1','@':'2','#':'3','$':'4','%':'5','^':'6','&':'7','*':'8','(':'9',')':'0','_':'-','+':'=','{':'[','}':']',':':';','"':"'",'<':',','>':'.','?':'/'};
const fingerNames={'Левый мизинец':'Left pinky','Левый безымянный':'Left ring finger','Левый средний':'Left middle finger','Левый указательный':'Left index finger','Левый большой палец':'Left thumb','Правый указательный':'Right index finger','Правый средний':'Right middle finger','Правый безымянный':'Right ring finger','Правый мизинец':'Right pinky','Большой палец':'Right thumb'};
G.Keyboard=class extends Base{
 constructor(root,settings={}){super(root,settings);if(G.I18n.language!=='en')return;for(const [code,key] of Object.entries(layout)){const el=this.codes[code];if(!el)continue;el.textContent=key;this.keys[key]=el;el.classList.toggle('home-key',key==='f'||key==='j');}const space=this.codes.Space;if(space){space.textContent='Space';this.keys[' ']=space;}}
 base(char){if(G.I18n.language!=='en')return super.base(char);return shifted[char]||char?.toLowerCase();}
 target(char,allowed=''){const value=super.target(char,allowed);if(G.I18n.language!=='en')return value;let result=value.replace(' + противоположный Shift',' + opposite Shift');for(const [ru,en] of Object.entries(fingerNames))result=result.replace(ru,en);return result;}
};
})(EditorGame);

