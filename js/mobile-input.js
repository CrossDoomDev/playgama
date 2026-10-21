'use strict';
(function(G){
let shift=false;
const shiftedRu={Digit1:'!',Digit2:'"',Digit3:'#',Digit4:';',Digit5:'%',Digit6:':',Digit7:'?',Digit8:'*',Digit9:'(',Digit0:')',Minus:'_',Equal:'+',Period:',',Backslash:'/'};
const shiftedEn={Digit1:'!',Digit2:'@',Digit3:'#',Digit4:'$',Digit5:'%',Digit6:'^',Digit7:'&',Digit8:'*',Digit9:'(',Digit0:')',Minus:'_',Equal:'+',BracketLeft:'{',BracketRight:'}',Semicolon:':',Quote:'"',Comma:'<',Period:'>',Slash:'?'};
const coarse=()=>matchMedia('(pointer: coarse)').matches||innerWidth<=780;
const resetShift=()=>{shift=false;document.querySelectorAll('.key.touch-shift').forEach(el=>el.classList.remove('touch-shift'));};
function keyValue(el){const code=el.dataset.code,label=el.textContent.trim();if(code==='Space')return ' ';if(code==='Backspace')return 'Backspace';if(code==='Enter')return 'Enter';if(code.startsWith('Shift'))return 'Shift';if(label.length!==1)return '';if(!shift)return label;const map=G.I18n?.language==='en'?shiftedEn:shiftedRu;return map[code]||label.toUpperCase();}
document.addEventListener('pointerdown',event=>{const el=event.target.closest?.('.key[data-code]');if(!el||!coarse()||event.button>0)return;event.preventDefault();event.stopPropagation();const code=el.dataset.code;if(code.startsWith('Shift')){shift=!shift;document.querySelectorAll('.key[data-code^=Shift]').forEach(key=>key.classList.toggle('touch-shift',shift));return;}const key=keyValue(el);if(!key)return;el.classList.add('touch-pressed');setTimeout(()=>el.classList.remove('touch-pressed'),120);document.dispatchEvent(new KeyboardEvent('keydown',{key,code,bubbles:true,shiftKey:shift}));document.dispatchEvent(new KeyboardEvent('keyup',{key,code,bubbles:true,shiftKey:shift}));resetShift();},{capture:true,passive:false});
document.addEventListener('game-language-change',resetShift);G.MobileInput={coarse,keyValue};
})(EditorGame);
