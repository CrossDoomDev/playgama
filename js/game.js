'use strict';
(function(G){
const U=G.UI;
G.Game=class{
constructor(){this.s=G.Save.load();this.sdk=new G.BridgeService();this.cloudBaseline=JSON.parse(JSON.stringify(this.s));this.platform=new G.PlaygamaProgress(this);this.audio=new G.Audio(this.s.settings);this.task=null;this.engine=null;this.reasons=new Set();this.page='start';this.sdk.pause=r=>this.pause(r);this.sdk.resume=r=>this.resume(r);this.sdk.onAudioChange=enabled=>this.audio.mute(!enabled);this.lastDay=G.Daily.day();this.keyboard=null;}
development(){return G.Development?.enabled===true;}
save(){if(this.engine&&!this.engine.done)this.s.checkpoint=G.Session.capture(this.task,this.engine);else if(this.page!=='start')this.s.checkpoint={};G.Save.write(this.s);this.platform?.queue();}
releaseKeyboard(){this.keyboard?.dispose();this.keyboard=null;}
async init(){
G.Cosmetics.apply(this.s);
G.Energy.recover(this.s);G.Daily.refresh(this.s);this.save();
document.addEventListener('keydown',e=>this.keydown(e));
document.addEventListener('click',e=>{if(this.sdk.busy&&this.sdk.isAvailable){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('keyup',e=>this.keyboard?.codes[e.code]?.classList.remove('pressed'));
window.addEventListener('blur',()=>{this.pause('focus');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pause('hidden');else{this.resume('hidden');this.resume('focus');}});
window.addEventListener('focus',()=>{this.resume('focus');});
window.addEventListener('beforeunload',()=>this.save());
document.addEventListener('pointerdown',()=>this.audio.unlock(),{once:true});
setInterval(()=>this.tick(),250);
await this.sdk.init();G.I18n.setLanguage(this.sdk.language);this.renderStart();
await this.platform.init(this.cloudBaseline);G.Cosmetics.apply(this.s);this.audio.settings=this.s.settings;this.scene();
await Promise.all(['assets/backgrounds/home.webp','assets/backgrounds/newsroom-reference.webp','assets/backgrounds/office.webp','assets/icons/editor.webp'].map(src=>new Promise(resolve=>{const img=new Image();img.onload=img.onerror=resolve;img.src=src;})));
const begin=document.querySelector('[data-action=begin]');if(begin){begin.disabled=false;begin.removeAttribute('aria-busy');}this.sdk.ready();if(this.engine&&!this.engine.done&&!this.reasons.size)this.sdk.start();if(G.Save.warning)U.toast(G.Save.warning);
}
bind(){U.bind((a,id,el)=>this.action(a,id,el));}
chrome(active='home'){G.Energy.recover(this.s);G.Daily.refresh(this.s);U.header(this.s);U.nav(active,this.s);U.decor(this.s);this.bind();}
scene(){const stage=G.Career.index(this.s),el=document.querySelector('#scene');el.classList.toggle('office',stage>0);el.dataset.career=stage;el.style.backgroundImage='url("assets/backgrounds/'+G.Career.current(this.s).background+'")';}
renderStart(){this.releaseKeyboard();this.page='start';this.scene();document.querySelector('#header').innerHTML='';document.querySelector('#nav').innerHTML='';document.querySelector('#main').innerHTML='<section class="start-card"><div class="eyebrow">ИСТОРИЯ ОДНОЙ КЛАВИАТУРЫ</div><h1>Редактор<br><em>новостей</em></h1><p>Большие истории начинаются<br>с одной клавиши.</p><button class="primary large" data-action="begin" disabled aria-busy="true">'+(this.s.intro?'Продолжить историю':'Начать историю')+' <span>→</span></button><small>Уютная игра, которая учит печатать вслепую</small><div class="start-note">Русская раскладка · Физическая клавиатура</div></section>';this.bind();}
begin(){this.audio.unlock();G.Career.promote(this.s);G.checkAchievements(this.s);this.save();const checkpoint=this.s.checkpoint,task=G.Session.task(this.s,checkpoint);if(task){this.startTask(task,checkpoint);return;}if(!this.s.intro&&!this.development())this.intro(0);else this.home();}

endingScene(frame=0,replay=false){
if(!G.Career.finished(this.s)||(!replay&&this.s.endingSeen))return false;
this.sdk.stop();this.engine=null;this.task=null;this.releaseKeyboard();this.reasons.clear();U.close();this.audio.mute(false);
this.page='ending';this.scene();this.audio.play('scene');
const frames=[
['Весь город читает','Последний материал отправлен в печать. В редакции хлопают в ладоши, принтер впервые не зажевал бумагу, а кот торжественно лёг на свежий тираж. Кажется, это его высшая оценка.'],
['Посмотри, какой путь ты прошёл','Помнишь первое упражнение дома? Буквы приходилось искать, ошибки раздражали, а длинный текст казался горой. Ты продолжал — шаг за шагом. Теперь за плечами 26 уроков и 52 опубликованные истории. Это получилось благодаря твоей практике и терпению.'],
['Большие истории начинаются с тебя','Ты сделал это! Умение печатать уверенно останется с тобой — в учёбе, работе и собственных историях. Не обязательно быть идеальным, чтобы двигаться вперёд. Достаточно пробовать снова. Спасибо за каждую строчку. Впереди ещё столько хороших новостей!']
],text=frames[frame];
document.querySelector('#header').innerHTML='';document.querySelector('#nav').innerHTML='';
document.querySelector('#main').innerHTML='<section class="story ending-story" data-ending-frame="'+frame+'"><img src="assets/icons/editor.webp" alt="Редактор празднует завершение истории"><div><div class="eyebrow">СПЕЦИАЛЬНЫЙ ВЫПУСК · ТВОЯ ПОБЕДА · '+(frame+1)+' / '+frames.length+'</div><h2>'+text[0]+'</h2><p>'+text[1]+'</p><button class="primary" data-action="ending-next">'+(frame===frames.length-1?'Продолжить свободную игру':'Продолжить →')+'</button></div></section>';
document.querySelector('[data-action=ending-next]').onclick=()=>{if(frame+1<frames.length)this.endingScene(frame+1,replay);else{this.s.endingSeen=true;G.checkAchievements(this.s);this.save();this.home();}};
return true;
}

careerScene(frame=0){
if(this.development())return false;if(!G.Career.pending(this.s))return this.endingScene();
this.sdk.stop();this.engine=null;this.task=null;this.releaseKeyboard();U.close();
this.page='intro';this.scene();this.audio.play('scene');
const stage=G.Career.index(this.s),texts=G.Career.scenes[stage],text=texts[frame];
document.querySelector('#header').innerHTML='';document.querySelector('#nav').innerHTML='';
document.querySelector('#main').innerHTML='<section class="story" data-career-scene="'+stage+'"><img src="assets/icons/editor.webp" alt="Редактор"><div><div class="eyebrow">НОВАЯ ГЛАВА · '+(frame+1)+' / '+texts.length+'</div><h2>'+text[0]+'</h2><p>'+text[1]+'</p><button class="primary" data-action="career-next">Продолжить →</button></div></section>';
document.querySelector('[data-action=career-next]').onclick=()=>{if(frame+1<texts.length)this.careerScene(frame+1);else{this.s.careerSceneSeen=stage;this.save();this.showPage('news');}};
return true;
}

intro(frame){
this.releaseKeyboard();
this.page='intro';this.scene();this.audio.play('scene');
const texts=[
['У каждой истории есть начало','Я читаю газеты с детства. Хочется однажды увидеть в них и свою работу. Пока у меня есть только старый компьютер и свободный вечер.'],
['Требуется стажёр','Районная газета ищет редактора! Новостей много, а рук мало. Главное условие — уверенно печатать, не глядя на клавиатуру.'],
['Сначала — одна клавиша','Пока мои пальцы ищут каждую букву. Начну дома: спокойно, без таймера. Сначала точность. Скорость придёт. Каждая попытка упражнения стоит одну энергию.']
];
document.querySelector('#header').innerHTML='';document.querySelector('#nav').innerHTML='';
document.querySelector('#main').innerHTML='<section class="story"><img src="assets/icons/editor.webp" alt="Начинающий редактор"><div><div class="eyebrow">'+'ПРОЛОГ'+' · '+(frame+1)+' / '+texts.length+'</div><h2>'+texts[frame][0]+'</h2><p>'+texts[frame][1]+'</p><button class="primary" data-action="story-next">Продолжить →</button></div></section>';
document.querySelector('[data-action="story-next"]').onclick=()=>{if(frame+1<texts.length)this.intro(frame+1);else{this.s.intro=true;this.save();this.startLesson(0);}};
}
home(){if(this.careerScene())return;this.releaseKeyboard();this.page='home';this.scene();this.chrome();const l=G.data.lessons[this.s.lesson];
document.querySelector('#main').innerHTML=U.workstation(null,this.s);
this.keyboard=new G.Keyboard(document.querySelector('#keyboard'),{...this.s.settings,handSkin:this.s.handSkin});const keyboard=this.keyboard;requestAnimationFrame(()=>{if(this.keyboard===keyboard&&keyboard.root.isConnected)keyboard.target(l.added[0]||'ф',l.keys);});this.bind();}
notebook(){return '<aside class="notebook"><div class="eyebrow">МОЙ БЛОКНОТ</div><h3>Маленькие шаги</h3><p>Цель дня</p><b>3 успешных задания</b><progress max="3" value="'+this.s.daily.tasks+'"></progress><small>'+Math.min(3,this.s.daily.tasks)+' / 3 · 100 монет и 50 опыта</small><button data-action="daily">'+(this.s.daily.claimed?'Награда получена':'Посмотреть цель')+'</button><hr><p>Следующая остановка</p><b>'+(this.s.office?'Первая публикация':'Районная редакция')+'</b><small>'+G.Career.goal(this.s)+'</small><hr><blockquote>«Скорость приходит после точности.»</blockquote></aside>';}
startLesson(id){if(this.careerScene())return;const lesson=G.data.lessons[id];if(!lesson||(!this.development()&&id>this.s.lesson))return;this.startTask({kind:'lesson',lesson,text:G.data.makeExercise(lesson,this.s.mastery)});}
startNews(id){if(this.careerScene())return;const news=G.data.news[id];if(!news||(!this.development()&&!this.s.office)||!G.Progress.canNews(this.s,news))return;this.startTask({kind:'news',news,text:news.text,keyboardLesson:this.development()?G.data.lessons[G.data.lessons.length-1]:undefined});}
startTask(task,checkpoint=null){if(this.engine&&!this.engine.done)return;if(!checkpoint&&!G.Energy.spend(this.s)&&!this.development()){this.home();this.energyModal();return;}this.save();this.releaseKeyboard();U.close();this.task=task;this.engine=new G.TypingEngine(task.text);if(checkpoint)G.Session.restore(this.engine,checkpoint);this.reasons.delete('menu');this.reasons.delete('manual');this.reasons.delete('focus');this.page='typing';this.scene(task.kind==='news');this.chrome(task.kind==='news'?'news':'home');this.audio.mute(false);
const title=task.kind==='lesson'?task.lesson.title:task.news.title;
document.querySelector('#main').innerHTML=U.workstation(task,this.s);
this.keyboard=new G.Keyboard(document.querySelector('#keyboard'),{...this.s.settings,handSkin:this.s.handSkin});U.typing(this.engine);requestAnimationFrame(()=>this.updateTarget());this.bind();document.activeElement?.blur();if(this.reasons.size){this.engine.pause();this.audio.mute(true);this.showPauseCover();}else this.sdk.start();this.save();}
updateTarget(){if(!this.engine||!this.keyboard)return;const char=this.engine.text[this.engine.position];const l=this.task.lesson||this.task.keyboardLesson||G.data.lessons[this.s.lesson];const tip=this.keyboard.target(char,l.keys);const el=document.querySelector('#finger-tip');if(el)el.textContent=tip||'Готово';}
keydown(e){if(this.sdk.busy&&this.sdk.isAvailable){e.preventDefault();return;}
if(e.key==='Escape'&&this.engine&&!this.engine.done&&!this.reasons.has('menu')){e.preventDefault();if(this.reasons.has('manual'))this.closeMenu();else this.pauseModal();return;}
if(!this.engine||this.engine.done||this.reasons.size||e.isComposing||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;
if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
if(e.key==='Tab'||e.key===' '||e.key==='Backspace'||e.key==='Enter')e.preventDefault();
this.keyboard?.press(e.code,e.key);
if(e.key.length===1||e.key==='Backspace'){const result=this.engine.input(G.inputKey(e));if(!result)return;this.audio.play(result.backspace?'key':result.correct?'success':'error');U.typing(this.engine);this.updateTarget();if(result.done)this.finish();else this.save();}
}
pause(reason){this.reasons.add(reason);if(this.engine&&!this.engine.done){this.engine.pause();this.sdk.stop();this.keyboard?.clear();this.showPauseCover();}this.audio.mute(true);this.save();}
resume(reason){this.reasons.delete(reason);if(!this.reasons.size){if(this.engine&&!this.engine.done){this.engine.resume();this.updateTarget();this.sdk.start();}this.audio.mute(this.sdk.audioEnabled===false);document.querySelector('.pause-cover')?.remove();}}
showPauseCover(){const screen=document.querySelector('.monitor.active');if(!screen||screen.querySelector('.pause-cover'))return;const el=document.createElement('div');el.className='pause-cover';el.innerHTML='<h2>Небольшая пауза</h2><p>Время и ввод остановлены.</p><button class="primary">Продолжить</button>';el.querySelector('button').onclick=()=>{this.resume('focus');this.resume('manual');};screen.append(el);}
pauseModal(){this.pause('manual');U.modal('Пауза','<p>Выдохни, расслабь плечи. Таймер подождёт.</p>',[{label:'Продолжить',primary:true,run:()=>this.closeMenu()},{label:'Завершить без награды',run:()=>{this.abandon();this.home();}}]);}
closeMenu(){U.close();this.resume('menu');this.resume('manual');this.resume('focus');}
abandon(){this.sdk.stop();this.engine=null;this.task=null;this.releaseKeyboard();this.reasons.clear();U.close();this.audio.mute(false);this.save();}
finish(timeout=false){
if(!this.engine||this.page==='result')return;this.engine.pause();this.keyboard?.clear();this.sdk.stop();const result=this.engine.result();if(timeout)result.complete=false;
const task=this.task;const outcome=G.Progress.complete(this.s,task,result);if(outcome.passed)this.sdk.completed();if(outcome.passed&&result.accuracy===100)this.s.perfect=true;
const achievements=G.checkAchievements(this.s);this.save();this.page='result';this.audio.play(outcome.passed?'finish':'error');this.engine.done=true;this.reasons.clear();
const body='<div class="result-icon">'+U.icon(outcome.passed?'trophy':'editor')+'</div><p>'+(outcome.passed?(outcome.unlocked?'Новые клавиши открыты. Отличная работа!':'Точность растёт с каждой тренировкой.'):(timeout?'Дедлайн истёк. Потренируйся и попробуй снова.':'Для успеха нужна точность '+(task.lesson?.accuracy||90)+'%'+(task.lesson?.minSpeed?' и скорость '+task.lesson.minSpeed+' знаков/мин':'')+'. Повтори в спокойном темпе.'))+'</p><div class="result-stats"><b>'+Math.round(result.accuracy)+'%<small>точность</small></b><b>'+result.speed+'<small>знаков/мин</small></b><b>'+result.errors+'<small>ошибок</small></b></div><p class="reward-line">+'+outcome.coins+' монет · +'+outcome.xp+' опыта</p>'+(outcome.passed&&task.kind==='lesson'&&!outcome.unlocked&&!this.development()?'<small>Следующий урок: по 3 попытки на клавишу, точность клавиш от 85% и 2 успешных задания подряд.</small>':'')+(achievements.length?'<p>Достижения: '+achievements.join(', ')+' · +'+achievements.length*20+' монет</p>':'');
const next=()=>{this.abandon();if(outcome.promoted&&!this.development())this.careerScene();else if(task.kind==='news')this.showPage('news');else this.startLesson(this.development()?Math.min(task.lesson.id+1,G.data.lessons.length-1):this.s.lesson);};
const buttons=[{label:outcome.passed?'Продолжить':'Попробовать ещё',primary:true,run:outcome.passed?next:()=>{this.abandon();task.kind==='news'?this.startNews(task.news.id):this.startLesson(task.lesson.id);}},{label:'К рабочему столу',run:()=>{this.abandon();if(outcome.promoted&&!this.development())this.careerScene();else this.home();}}];
let leaving=false;for(const button of buttons){const proceed=button.run;button.run=async()=>{if(leaving||this.sdk.busy)return;leaving=true;try{if(outcome.passed)await completionAd;proceed();}finally{leaving=false;}};}
if(this.development()){buttons.push({label:'Повторить уровень',run:()=>{this.abandon();task.kind==='news'?this.startNews(task.news.id):this.startLesson(task.lesson.id);}});}
if(outcome.passed&&task.kind==='news'&&this.sdk.canReward()){const rewardId=this.s.lastReward.id;buttons.push({label:'×2 награда · реклама',run:async()=>{await this.reward(()=>G.Progress.double(this.s,rewardId));U.modal('Награда за новость','<p>Баланс: '+this.s.coins+' монет · '+this.s.xp+' опыта</p>',buttons.slice(0,2));}});}
U.modal(outcome.passed?(task.kind==='news'?'В номер!':'Упражнение завершено'): 'Ещё немного практики',body,buttons);
const completionAd=outcome.passed?this.sdk.betweenTasks():Promise.resolve(false);
void this.platform.flush();void this.platform.submitScore();
}
tick(){G.Energy.recover(this.s);const today=G.Daily.day();if(today!==this.lastDay){this.lastDay=today;G.Daily.refresh(this.s);this.save();if(this.page!=='start'&&this.page!=='intro'&&this.page!=='ending')this.chrome(this.page);}
const meter=document.querySelector('#energy-meter');if(meter)meter.value=this.s.energy;const energy=document.querySelector('#energy-value');if(energy)energy.textContent=this.s.energy+'/'+G.Energy.MAX;const time=document.querySelector('#energy-time');if(time)time.textContent=G.I18n.t(this.s.energy===G.Energy.MAX?'полная':'1 через '+U.time(G.Energy.remaining(this.s)));
if(this.engine&&!this.engine.done&&!this.reasons.size){U.typing(this.engine);if(this.task.kind==='news'){const remain=this.task.news.deadline*1000-this.engine.elapsed();const clock=document.querySelector('#clock');if(clock)clock.textContent=U.time(Math.max(0,remain));const deadline=document.querySelector('#deadline-meter');if(deadline)deadline.value=Math.max(0,remain/1000);if(remain<=0)this.finish(true);}}
}
showPage(page){if(this.careerScene())return;this.releaseKeyboard();this.page=page;this.scene(page==='news'||page==='archive');this.chrome(page);let title='',subtitle='',body='';
if(page==='lessons'){title='Школа слепой печати';subtitle=this.development()?'Все 26 уроков доступны. Выбирай любой: результаты и мастерство сохраняются.':'Каждая попытка — 1 энергия. Новые клавиши открываются по навыку. '+G.Career.goal(this.s);
body='<div class="lesson-grid">'+G.data.lessons.map(l=>'<button class="lesson-card '+(l.id===this.s.lesson?'current-lesson':'')+'" data-action="lesson" data-id="'+l.id+'" '+(l.id>this.s.lesson&&!this.development()?'disabled':'')+'><small>УРОК '+String(l.id+1).padStart(2,'0')+'</small><b>'+l.title+'</b><span>'+U.escape(l.added||'Повторение')+'</span><small>'+(this.s.passes[l.id]?'Успешных повторов: '+this.s.passes[l.id]:l.id>this.s.lesson&&!this.development()?'Откроется после предыдущего':'Можно начинать')+'</small></button>').join('')+'</div><h3>Мастерство клавиш</h3><div class="mastery">'+Object.entries(this.s.mastery).map(([k,m])=>'<div title="Среднее время: '+Math.round(m.average||0)+' мс"><b>'+U.escape(G.I18n.keyLabel(k))+'</b><span>'+['Не изучена','Знакома','Освоена','Уверенная','Автоматизирована'][m.level||0]+'</span><small>'+Math.round(m.accuracy||0)+'% · '+m.presses+' нажатий · '+m.errors+' ошибок</small></div>').join('')+'</div>';
}
if(page==='news'){title=G.Career.current(this.s).name;subtitle=this.development()?'Все '+G.data.news.length+' статьи доступны для тестирования. Более длинные материалы дают больше монет и опыта.':this.s.office?'«'+G.Career.current(this.s).paper+'» · Каждая попытка стоит 1 энергию. '+G.Career.goal(this.s):G.Career.goal(this.s);
body=G.NewsLibrary.render(this.s,this.development());
}
if(page==='shop'){title='Магазин оформления';subtitle='Собери свой стиль: 11 тем, 6 скинов рук и 9 аватаров. Стандартные варианты бесплатны.'+(this.development()?' В режиме разработки весь ассортимент доступен.':' Покупки меняют только внешний вид игры.');
body=G.Cosmetics.shop(this.s,this.shopGroup||'theme',this.development());
}
if(page==='achievements'){title='Маленькие победы';subtitle=this.s.achievements.length+' / '+G.data.achievements.length+' достижений · За каждое — 20 монет.';
body=(this.s.endingSeen?'<button data-action="replay-ending">Ещё раз посмотреть финал</button>':'')+'<div class="achievement-grid">'+G.data.achievements.map(([id,name,desc])=>'<article class="achievement '+(this.s.achievements.includes(id)?'earned':'')+'">'+U.icon('trophy')+'<div><h3>'+name+'</h3><p>'+desc+'</p><small>'+(this.s.achievements.includes(id)?'Получено':'Впереди')+'</small></div></article>').join('')+'</div>';
}
if(page==='archive'){title='Архив добрых новостей';subtitle='Опубликовано: '+this.s.archive.length+' / '+G.data.news.length+' статей.'+(this.development()?' Все истории доступны для чтения.':'');
body=G.NewsLibrary.render(this.s,this.development(),true);
}
document.querySelector('#main').innerHTML='<section class="page-panel"><div class="eyebrow">РЕДАКТОР НОВОСТЕЙ</div><h2>'+title+'</h2><p class="page-subtitle">'+subtitle+'</p>'+body+'</section>';if(page==='shop')G.HandMaterials.preview(document.querySelector('#main'));this.bind();}
buy(id){const item=G.data.shop.find(i=>i.id===id);if(!item)return;const s=this.s;if(!s.owned.includes(id)){if(s.coins<item.price&&!this.development())return;s.coins=Math.max(0,s.coins-item.price);s.owned.push(id);s.purchases=(s.purchases||0)+1;this.audio.play('coin');G.checkAchievements(s);}G.Cosmetics.equip(s,id);this.save();G.Cosmetics.apply(s);this.showPage('shop');}
menu(title,body,buttons=[]){if(this.engine&&!this.engine.done)this.pause('menu');U.modal(title,body,[...buttons,{label:'Закрыть',run:()=>this.closeMenu()}]);}
profile(){
G.Daily.refresh(this.s);
const close=()=>{this.closeMenu();document.querySelector('.profile-card')?.focus();};
if(this.engine&&!this.engine.done)this.pause('menu');
U.modal('Профиль игрока',G.PlayerProfile.render(this.s),[{label:'Вернуться к игре',primary:true,run:close},{label:'Рейтинг редакторов',run:()=>this.platform.showLeaderboard()}]);
const dialog=document.querySelector('#modal-root .modal');dialog.classList.add('profile-dialog');dialog.scrollTop=0;
dialog.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='Tab'){e.preventDefault();dialog.querySelector('.modal-actions button').focus();}};
}
settings(){this.menu('Настройки','<label class="setting">Музыка <input id="music-setting" type="checkbox" '+(this.s.settings.music?'checked':'')+'></label><label class="setting">Звуки <input id="sound-setting" type="checkbox" '+(this.s.settings.sound?'checked':'')+'></label><label class="setting">Цветные зоны пальцев <input id="finger-colors-setting" type="checkbox" '+(this.s.settings.fingerColors?'checked':'')+' aria-describedby="finger-colors-help"></label><div id="finger-colors-help" class="finger-colors-help"><p>Цвет клавиши подсказывает, каким пальцем её нажимать.</p><div class="finger-color-legend"><span data-zone="pinky">Мизинцы</span><span data-zone="ring">Безымянные</span><span data-zone="middle">Средние</span><span data-zone="left-index">Левый указательный</span><span data-zone="right-index">Правый указательный</span><span data-zone="thumb">Большие</span></div></div><label class="setting">Прозрачность рук <input id="hands-setting" type="range" min="0" max="0.8" step="0.05" value="'+this.s.settings.hands+'"></label><p>Руки показывают, каким пальцем печатать. Приложение не определяет, какой палец ты используешь физически.</p><small>'+(this.platform.status())+'</small><p>'+U.escape(G.Save.warning)+'</p>',[{label:'Полный сброс игры',run:()=>this.confirmReset()},{label:'Войти через Playgama · сохранения и рейтинг',disabled:!this.sdk.sdk?.player?.isAuthorizationSupported,run:()=>this.platform.authorize()}]);
document.querySelector('#music-setting').onchange=e=>{this.s.settings.music=e.target.checked;this.save();};
document.querySelector('#sound-setting').onchange=e=>{this.s.settings.sound=e.target.checked;this.save();};
document.querySelector('#finger-colors-setting').onchange=e=>{this.s.settings.fingerColors=e.target.checked;this.keyboard?.setFingerColors(e.target.checked);this.save();};
document.querySelector('#hands-setting').oninput=e=>{this.s.settings.hands=Number(e.target.value);if(this.keyboard)this.keyboard.hands.root.style.opacity=e.target.value;this.save();};}
confirmReset(){
if(this.sdk.busy)return;
const cancel=()=>this.settings();
U.modal('Начать игру заново?','<p>Будут удалены весь прогресс, монеты, покупки оформления, открытые уроки и новости, достижения, статистика и настройки в этом браузере и облачное сохранение. Тестовое сохранение тоже будет удалено.</p><p><strong>Отменить сброс после подтверждения нельзя.</strong></p>',[{label:'Отмена',primary:true,run:cancel},{label:'Удалить всё и начать заново',run:()=>this.resetGame()}]);
const dialog=document.querySelector('#modal-root .modal');
dialog.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel();}};
}
resetGame(){
if(this.sdk.busy)return;
const state=G.Save.reset();
if(!state){U.toast(G.Save.warning);return;}
this.sdk.stop();this.engine=null;this.task=null;this.releaseKeyboard();this.reasons.clear();U.close();
this.s=state;this.save();void this.platform.flush();this.audio.settings=state.settings;this.audio.mute(false);this.shopGroup='theme';this.lastDay=G.Daily.day();
G.Cosmetics.apply(state);this.renderStart();
const begin=document.querySelector('[data-action=begin]');begin.disabled=false;begin.removeAttribute('aria-busy');begin.focus();
U.toast('Игра сброшена. Можно начать новую историю.');
}
daily(){G.Daily.refresh(this.s);this.menu('Практика каждый день','<div class="result-icon">'+U.icon('flame')+'</div><h3>Серия: '+this.s.streak+' дней</h3><p>'+(this.s.lastPractice===G.Daily.day()?'Сегодняшняя практика выполнена.':'Сегодняшняя практика ещё не выполнена.')+'</p><p>Заверши 3 задания: '+Math.min(3,this.s.daily.tasks)+' / 3</p><p>Набрано сегодня: '+this.s.daily.chars+' символов · Новостей: '+this.s.daily.news+'</p><small>Нажми на значок подарка в верхней панели, чтобы забрать ежедневный подарок. Серия растёт только за успешное задание.</small>',[{label:this.s.daily.claimed?'Награда получена':'Забрать 100 монет и 50 опыта',disabled:this.s.daily.claimed||this.s.daily.tasks<3,primary:true,run:()=>{if(G.Daily.claim(this.s)){this.save();this.audio.play('gift');this.chrome(this.page);}this.daily();}}]);}
gift(){const reward=G.Daily.gift(this.s);this.save();if(reward){this.audio.play('gift');this.chrome(this.page);}this.menu('Ежедневный подарок','<div class="result-icon">'+U.icon('gift')+'</div><p>'+(reward?'Получено: '+reward:'Сегодняшний подарок уже получен. Возвращайся завтра!')+'</p><p>Следующий подарок: день '+(this.s.giftIndex%7+1)+' из 7.</p><small>50 монет → энергия → 100 монет → опыт → аватар кота → 2 энергии → неоновая тема.</small>');}
energyModal(){if(this.engine&&!this.engine.done){U.toast('Реклама доступна после завершения задания. Каждая новая попытка стоит 1 энергию.');return;}
this.menu('Энергия редактора','<div class="result-icon">'+U.icon('energy')+'</div><p>'+this.s.energy+' / '+G.Energy.MAX+' · Восстановление: 1 энергия за '+(G.Energy.INTERVAL/60000)+' минут.</p><p>Каждая попытка упражнения или новости стоит 1 энергию.</p>',[{label:this.sdk.local&&!this.sdk.isAvailable?'Симулировать рекламу · +1 энергия':'Смотреть рекламу · +1 энергия',disabled:this.s.energy>=G.Energy.MAX||!this.sdk.canReward(),primary:true,run:async()=>{await this.reward(()=>G.Energy.add(this.s));this.energyModal();}}]);}
simulate(){return new Promise(resolve=>{U.modal('Тестовая реклама','<p>Локальный симулятор. Награда выдаётся только при подтверждении просмотра.</p>',[{label:'Просмотр завершён',primary:true,run:()=>resolve(true)},{label:'Закрыть без награды',run:()=>resolve(false)}]);});}
async reward(grant){if(this.engine&&!this.engine.done)return;const ok=await this.sdk.rewarded(()=>{grant();this.save();this.audio.play('coin');},()=>this.simulate());this.chrome(this.task?.kind==='news'?'news':this.page);U.toast(ok?'Награда получена.':'Просмотр не подтверждён. Награда не начислена.');}
navigate(action){if(this.engine&&!this.engine.done){this.pause('menu');U.modal('Завершить тренировку?','<p>Незавершённое задание не даст награду. Энергия за начатое задание уже потрачена.</p>',[{label:'Продолжить печатать',primary:true,run:()=>this.closeMenu()},{label:'Перейти',run:()=>{this.abandon();action();}}]);}else{this.abandon();action();}}
action(action,id){this.audio.unlock();
if(action==='replay-ending')return this.navigate(()=>this.endingScene(0,true));
if(action==='begin')return this.begin();
if(action==='profile')return this.profile();
if(action==='settings')return this.settings();
if(action==='pause')return this.pauseModal();
if(action==='daily')return this.daily();
if(action==='gift')return this.gift();
if(action==='energy')return this.energyModal();
if(action==='shop-category'){if(!G.Cosmetics.fields[id])return;this.shopGroup=id;return this.showPage('shop');}
if(action==='cosmetic-default'){if(!G.Cosmetics.reset(this.s,id))return;this.save();G.Cosmetics.apply(this.s);return this.showPage('shop');}
if(action==='buy')return this.buy(id);
if(action==='train')return this.startLesson(this.s.lesson);
if(action==='lesson')return this.startLesson(Number(id));
if(action==='news-task')return this.startNews(Number(id));
if(action==='home')return this.navigate(()=>this.home());
if(['lessons','news','shop','achievements','archive'].includes(action))return this.navigate(()=>this.showPage(action));
}
};
})(EditorGame);
