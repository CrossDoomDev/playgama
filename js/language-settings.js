'use strict';
(function(G){
const key='news-editor-language';
function preference(){try{const value=localStorage.getItem(key);return ['ru','en'].includes(value)?value:'auto';}catch{return 'auto';}}
const setLanguage=G.I18n.setLanguage.bind(G.I18n);
G.I18n.setLanguage=value=>setLanguage(preference()==='auto'?value:preference());
const settings=G.Game.prototype.settings;
G.Game.prototype.settings=function(){
 settings.call(this);
 const en=G.I18n.language==='en',active=this.engine&&!this.engine.done;
 const label=document.createElement('label');label.className='setting';
 label.append(document.createTextNode(en?'Language':'Язык'));
 const select=document.createElement('select');select.id='language-setting';select.style.cssText='font:inherit;max-width:65%;padding:8px;border-radius:8px;color:#172722;background:#fff3d9';
 for(const [value,text] of [['auto',en?'Automatic (SDK)':'Автоматически (SDK)'],['ru',en?'Russian':'Русский'],['en','English']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
 select.value=preference();select.disabled=!!active;label.append(select);
 const body=document.querySelector('.modal-body');body.prepend(label);
 const hint=document.createElement('small');hint.id='language-help';hint.textContent=active?(en?'Finish the current task to change language.':'Заверши текущее задание, чтобы сменить язык.'):(en?'Changing language reloads the game. Progress is saved.':'При смене языка игра перезагрузится. Прогресс сохранится.');label.after(hint);select.setAttribute('aria-describedby',hint.id);
 select.onchange=()=>{this.save();try{localStorage.setItem(key,select.value);}catch{select.value=preference();G.UI.toast(en?'Could not save language preference.':'Не удалось сохранить выбранный язык.');return;}location.reload();};
};
})(EditorGame);
