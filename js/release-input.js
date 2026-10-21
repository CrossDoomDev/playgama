'use strict';
(function(G){
const letters={KeyQ:'й',KeyW:'ц',KeyE:'у',KeyR:'к',KeyT:'е',KeyY:'н',KeyU:'г',KeyI:'ш',KeyO:'щ',KeyP:'з',BracketLeft:'х',BracketRight:'ъ',KeyA:'ф',KeyS:'ы',KeyD:'в',KeyF:'а',KeyG:'п',KeyH:'р',KeyJ:'о',KeyK:'л',KeyL:'д',Semicolon:'ж',Quote:'э',KeyZ:'я',KeyX:'ч',KeyC:'с',KeyV:'м',KeyB:'и',KeyN:'т',KeyM:'ь',Comma:'б',Period:'ю',Backquote:'ё'};
const english={BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Comma:',',Period:'.',Backquote:'`'};
G.inputKey=e=>{if(G.I18n?.language==='en'){if(e.code==='Space')return ' ';return e.key;}
if(/[а-яё]/i.test(e.key))return e.key;
const base=letters[e.code];
if(base){const upper=e.shiftKey!==!!e.getModifierState?.('CapsLock');return upper?base.toUpperCase():base;}
if(e.code==='Space')return ' ';
if(e.code==='Slash')return e.shiftKey?',':'.';
if(e.code==='Digit2'&&e.shiftKey)return '"';
if(e.code==='Digit6'&&e.shiftKey)return ':';
return e.key;
};
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('dragstart',e=>e.preventDefault());
document.addEventListener('selectstart',e=>{if(!e.target.closest('input,textarea'))e.preventDefault();});
})(EditorGame);
