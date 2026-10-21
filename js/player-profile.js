'use strict';
(function(G){
 const n=value=>Number.isFinite(value)?Math.max(0,value):0;
 const format=value=>new Intl.NumberFormat(G.I18n?.language==='en'?'en-US':'ru-RU',{maximumFractionDigits:1}).format(value);
 const keyLabel=key=>G.I18n?.keyLabel(key)||(key===' '?'Пробел':key.toUpperCase());
 G.PlayerProfile={
  summary(s){
   const keys=Object.entries(s.mastery).filter(([,m])=>m&&n(m.presses)>0).map(([key,m])=>{
    const presses=n(m.presses),errors=Math.min(presses,n(m.errors));
    return {key,presses,errors,accuracy:100*(presses-errors)/presses,level:Math.min(4,n(m.level))};
   });
   const attempts=keys.reduce((sum,k)=>sum+k.presses,0),errors=keys.reduce((sum,k)=>sum+k.errors,0);
   const lessons=G.data.lessons.filter(l=>n(s.passes[l.id])>0);
   const news=G.data.news.filter(item=>s.archive.includes(item.id));
   return {
    level:G.Progress.level(s),xp:s.xp%150,toNext:150-s.xp%150,
    lessons:lessons.length,lessonRepeats:lessons.reduce((sum,l)=>sum+n(s.passes[l.id]),0),
    news:news.length,achievements:G.data.achievements.filter(([id])=>s.achievements.includes(id)).length,
    cosmetics:G.data.shop.filter(item=>s.owned.includes(item.id)).length,
    keys,attempts,errors,accuracy:attempts?100*(attempts-errors)/attempts:null,
    mastered:keys.filter(k=>k.presses>=3&&k.accuracy>=85).length,
    weak:keys.filter(k=>k.presses>=3&&k.errors>0).sort((a,b)=>a.accuracy-b.accuracy||b.errors-a.errors).slice(0,5)
   };
  },
  render(s){
   const U=G.UI,p=this.summary(s),f=format;
   const metric=(id,label,value,unit='')=>'<div class="profile-stat" data-stat="'+id+'"><span>'+label+'</span><strong>'+value+'</strong><small>'+unit+'</small></div>';
   const bar=(id,title,value,max,note)=>'<div class="profile-progress" data-progress="'+id+'"><div><b>'+title+'</b><span>'+f(value)+' / '+f(max)+'</span></div><progress value="'+value+'" max="'+max+'" aria-label="'+title+'"></progress><small>'+note+'</small></div>';
   const lastDate=/^\d{4}-\d{2}-\d{2}$/.test(s.lastPractice)?s.lastPractice.split('-').reverse().join('.'):'Ещё не было';
   const lastLesson=G.data.lessons[s.lesson];
   return '<div class="player-profile">'+
    '<div class="profile-hero"><img src="'+G.Cosmetics.avatar(s)+'" alt="Аватар игрока"><div><span class="eyebrow">ЛИЧНОЕ ДЕЛО</span><h3>'+G.Career.current(s).role+'</h3><p>'+(G.Career.current(s).paper+' · '+G.Career.goal(s))+'</p><div class="profile-level-line"><b>Уровень '+p.level+'</b><span>'+f(s.xp)+' опыта всего</span></div><progress value="'+p.xp+'" max="150" aria-label="Опыт до следующего уровня"></progress><small>До уровня '+(p.level+1)+' — '+f(p.toNext)+' опыта</small></div></div>'+
    '<section class="profile-section"><h3>Результаты печати</h3><div class="profile-stats">'+
    metric('speed','Лучшая скорость',s.bestSpeed?f(s.bestSpeed):'—','знаков в минуту')+
    metric('accuracy','Общая точность',p.accuracy===null?'—':f(p.accuracy)+'%','по всем нажатиям')+
    metric('combo','Рекорд без ошибок',f(s.bestCombo),'символов подряд')+
    metric('chars','Верных нажатий',f(s.totalChars),'за всё время')+
    metric('errors','Ошибок',f(p.errors),'за всё время')+
    metric('tasks','Успешных заданий',f(s.totalTasks),'уроки и новости')+
    '</div><p class="profile-note">'+(p.attempts?'Учитываются завершённые попытки, включая неудачные.':'Заверши первое упражнение — здесь появятся скорость, точность и навыки.')+'</p></section>'+
    '<div class="profile-columns"><section class="profile-section"><h3>Твой прогресс</h3>'+
    bar('lessons','Пройдено уроков',p.lessons,G.data.lessons.length,'Успешных прохождений с повторами: '+f(p.lessonRepeats))+
    bar('news','Новостей в коллекции',p.news,G.data.news.length,'Всего публикаций с повторами: '+f(s.newsCount))+
    bar('achievements','Получено достижений',p.achievements,G.data.achievements.length,'Каждое достижение отмечает твой результат')+
    '<p class="profile-note">Текущий этап: урок '+(s.lesson+1)+' — '+U.escape(lastLesson.title)+'.</p></section>'+
    '<section class="profile-section"><h3>Практика и ритм</h3><div class="profile-rhythm"><b>'+f(s.streak)+'</b><span>дней практики подряд</span></div>'+
    bar('daily','Задания сегодня',Math.min(3,s.daily.tasks),3,s.daily.claimed?'Дневная награда получена':s.daily.tasks>=3?'Дневная цель выполнена. Награда доступна в календаре.':'Цель: 3 успешных задания за день')+
    '<dl class="profile-facts"><div><dt>Верных символов сегодня</dt><dd>'+f(s.daily.chars)+'</dd></div><div><dt>Новостей сегодня</dt><dd>'+f(s.daily.news)+'</dd></div><div><dt>Последняя практика</dt><dd>'+lastDate+'</dd></div><div><dt>Монеты</dt><dd>'+f(s.coins)+'</dd></div><div><dt>Оформление в коллекции</dt><dd>'+p.cosmetics+' / '+G.data.shop.length+' <small>+ 3 стандартных</small></dd></div></dl></section></div>'+
    '<section class="profile-section"><h3>Мастерство клавиш <span class="profile-count">'+p.mastered+' освоено из '+p.keys.length+' опробованных</span></h3>'+
    (p.keys.length?'<div class="profile-key-grid">'+p.keys.map(k=>'<div class="profile-key skill-'+k.level+'"><b>'+U.escape(keyLabel(k.key))+'</b><span>'+f(k.accuracy)+'%</span><small>'+['Начало','Знакомство','Освоение','Уверенно','Автоматически'][k.level]+'</small></div>').join('')+'</div><p class="profile-note">Освоение: от 3 нажатий и точность от 85%.</p>':'<p class="profile-note">Навыки появятся после первой завершённой попытки.</p>')+
    (p.weak.length?'<div class="profile-practice-tip"><b>Стоит потренировать</b><p>'+p.weak.map(k=>U.escape(keyLabel(k.key))+' — '+f(k.accuracy)+'%').join(' · ')+'</p><small>Клавиши с наименьшей точностью среди тех, что ты нажимал хотя бы 3 раза.</small></div>':'')+'</section>'+
    '<section class="profile-section"><h3>Достижения <span class="profile-count">'+p.achievements+' / '+G.data.achievements.length+'</span></h3><div class="profile-awards">'+
    G.data.achievements.map(([id,title,description])=>'<div class="profile-award '+(s.achievements.includes(id)?'earned':'')+'"><span class="profile-award-mark" aria-hidden="true">'+(s.achievements.includes(id)?'★':'☆')+'</span><div><b>'+U.escape(title)+'</b><p>'+U.escape(description)+'</p><small>'+(s.achievements.includes(id)?'Получено':'Ещё впереди')+'</small></div></div>').join('')+'</div></section></div>';
  }
 };
})(EditorGame);
