'use strict';
(function(G){
G.Career={
stages:[
{name:'Домашнее обучение',paper:'Моя комната',role:'Начинающий редактор',subtitle:'Школа слепой печати',background:'home.webp'},
{name:'Районная редакция',paper:'Светлый Город',role:'Помощник редактора',subtitle:'Районная газета',background:'office.webp'},
{name:'Городская редакция',paper:'Большой Город',role:'Редактор',subtitle:'Городская газета',background:'newsroom-reference.webp'}
],
index:s=>Math.max(s.office?1:0,Math.min(2,Math.floor(Number(s.career)||0))),
current(s){return this.stages[this.index(s)];},
required:n=>n.stage>=2?2:1,
pending(s){return this.index(s)>(s.careerSceneSeen||0);},
training(s){return G.data.lessons.filter(l=>(s.passes[l.id]||0)>0).length;},
publications(s){return G.data.news.filter(n=>n.stage<=1&&s.archive.includes(n.id));},
goal(s){
const stage=this.index(s);
if(stage===0)return 'Заверши все 26 уроков: '+this.training(s)+'/26. Финальный урок — два успешных прохождения; точность освоенных клавиш от 85%.';
if(stage===1){const news=this.publications(s);return 'Приглашение в «Большой Город»: уровень '+Math.min(G.Progress.level(s),14)+'/14, разные публикации '+Math.min(news.length,8)+'/8, из них городские истории '+Math.min(news.filter(n=>n.stage===1).length,4)+'/4.';}
return 'Городская редакция открыта. На уровне 14 доступны большие материалы, на уровне 20 — специальные выпуски.';
},
promote(s){if(this.pending(s))return false;
const stage=this.index(s);
if(stage===0&&this.training(s)===G.data.lessons.length&&(s.passes[25]||0)>=2&&G.Progress.mastered(s,G.data.lessons[25].keys)){
s.career=1;s.office=true;return true;
}
if(stage===1){const news=this.publications(s);if(G.Progress.level(s)>=14&&news.length>=8&&news.filter(n=>n.stage===1).length>=4){s.career=2;s.office=true;return true;}}
return false;
},
scenes:{
1:[['Первое собеседование','Обучение позади. Я прихожу в районную газету «Светлый Город» с распечаткой своих результатов. Редактор смотрит на точность, а кот — на пакет с обедом. Оба, кажется, одобряют кандидатуру.'],['Мой первый рабочий стол','Меня берут помощником редактора. Комната небольшая, принтер ворчит громче начальника, зато у каждого здесь есть своя история. Начну с коротких заметок и городских историй.']],
2:[['Письмо из большой редакции','Мои публикации заметили в газете «Большой Город». Приглашают в команду! На собеседовании спрашивают, умею ли я работать с длинными текстами. Отвечаю: да, даже если герой новости — лифт с характером.'],['Больше город — больше историй','Теперь у меня стол в большой редакции. Здесь готовят репортажи, большие материалы и специальные выпуски. Тексты длиннее, награды выше, а дедлайны по-прежнему не умеют ждать. Пора за работу.']]
}
};
G.Progress={
level:s=>1+Math.floor(s.xp/150),
record(s,events){for(const e of events){const k=e.expected.toLowerCase();const m=s.mastery[k]||(s.mastery[k]={presses:0,errors:0,reactionTotal:0,reactions:0});m.presses++;if(!e.correct)m.errors++;if(e.correct&&e.ms!==null){m.reactionTotal+=e.ms;m.reactions++;}m.accuracy=100*(m.presses-m.errors)/m.presses;m.average=m.reactions?m.reactionTotal/m.reactions:0;m.level=m.presses<3?1:m.accuracy<85?1:m.presses<12?2:m.accuracy<95||m.average>900?2:m.presses<40?3:4;}},
mastered(s,keys){return [...new Set(keys.toLowerCase())].every(k=>{const m=s.mastery[k];return m&&m.presses>=3&&m.accuracy>=85;});},
canNews(s,n){if(G.Development?.enabled)return true;const l=G.data.lessons[s.lesson];return G.Career.index(s)>=G.Career.required(n)&&n.available&&this.level(s)>=n.minLevel&&s.lesson>=n.minLesson&&[...n.text].every(c=>l.keys.includes(c.toLowerCase())&&(c===c.toLowerCase()||l.uppercase));},
complete(s,task,r){this.record(s,r.events);s.totalChars+=r.correct;s.bestCombo=Math.max(s.bestCombo,r.bestCombo);s.bestSpeed=Math.max(s.bestSpeed,r.speed);
const threshold=task.kind==='lesson'?task.lesson.accuracy:90;
const passed=r.complete&&r.accuracy>=threshold&&r.speed>=(task.lesson?.minSpeed||0);
s.successRun=passed?s.successRun+1:0;
let coins=0,xp=0,promoted=false,unlocked=false;
if(passed){s.totalTasks++;coins=task.kind==='news'?task.news.reward.coins:Math.floor(15/2);xp=Math.round((task.kind==='news'?task.news.reward.xp:25)+(r.accuracy>=98?10:0)+(r.speed>=100?10:0)+(r.bestCombo>=30?5:0));s.coins+=coins;s.xp+=xp;G.Daily.practice(s,r.correct,task.kind==='news');
if(task.kind==='news'){s.newsCount++;if(!s.archive.includes(task.news.id))s.archive.push(task.news.id);}
else{const l=task.lesson;s.passes[l.id]=(s.passes[l.id]||0)+1;if(l.id===s.lesson&&this.mastered(s,l.keys)&&s.successRun>=2&&s.lesson<G.data.lessons.length-1){s.lesson++;unlocked=true;}}
promoted=G.Career.promote(s);
}
const reward={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),coins,xp,kind:task.kind,doubled:false};s.lastReward=passed?reward:null;
return {passed,coins,xp,promoted,unlocked};
},
double(s,id){const r=s.lastReward;if(!r||r.id!==id||r.doubled||r.kind!=='news')return false;r.doubled=true;s.coins+=r.coins;s.xp+=r.xp;G.Career.promote(s);return true;}
};
G.data.achievements=[
['first','Первый шаг','Заверши упражнение.',s=>s.totalTasks>=1],
['perfect','Без ошибок','Заверши задание с точностью 100%.',s=>s.perfect===true],
['ten','Десять подряд','Напечатай 10 символов без ошибки.',s=>s.bestCombo>=10],
['hundred','Сто символов','Напечатай 100 верных символов.',s=>s.totalChars>=100],
['news','Первая новость','Опубликуй первую новость.',s=>s.newsCount>=1],
['three','Три дня подряд','Практикуйся 3 дня подряд.',s=>s.streak>=3],
['week','Неделя практики','Практикуйся 7 дней подряд.',s=>s.streak>=7],
['fast','Быстрые пальцы','Достигни 120 знаков в минуту.',s=>s.bestSpeed>=120],
['level','Редактор растёт','Получи второй уровень.',s=>G.Progress.level(s)>=2],
['buyer','Покупатель','Купи первый предмет.',s=>s.purchases>0]
];

G.Career.finished=s=>G.data.lessons.every(l=>(s.passes[l.id]||0)>0)&&G.data.news.every(n=>s.archive.includes(n.id));
const add=(id,title,description,test)=>G.data.achievements.push([id,title,description,test]);
G.data.lessons.forEach(l=>add('lesson-'+l.id,'Урок '+(l.id+1)+': '+l.title,'Успешно пройди урок «'+l.title+'».',s=>(s.passes[l.id]||0)>0));
[3,5,10,15,20,25,30,40,45,52].forEach(n=>add('published-'+n,'В архиве: '+n,'Опубликуй '+n+' разных новостей.',s=>G.data.news.filter(a=>s.archive.includes(a.id)).length>=n));
[5,10,20,30,50,75,100,200].forEach(n=>add('tasks-'+n,'Рабочий ритм: '+n,'Успешно выполни '+n+' заданий.',s=>s.totalTasks>=n));
[98,99].forEach(n=>add('precision-'+n,'Точность мастера: '+n+'%','Сохрани общую точность от '+n+'% после 1000 нажатий.',s=>{const m=Object.values(s.mastery),presses=m.reduce((v,k)=>v+(k.presses||0),0),errors=m.reduce((v,k)=>v+(k.errors||0),0);return presses>=1000&&(presses-errors)*100/presses>=n;}));
[500,1000,2500,5000,10000,20000,50000,100000].forEach(n=>add('chars-'+n,'История в '+n+' знаков','Набери '+n+' верных символов в завершённых попытках.',s=>s.totalChars>=n));
[40,60,80,100,150,200,250].forEach(n=>add('speed-'+n,'Темп редактора: '+n,'Достигни '+n+' знаков в минуту в завершённой попытке.',s=>s.bestSpeed>=n));
[25,50,100,200,300,500,1000].forEach(n=>add('combo-'+n,'Без запинки: '+n,'Напечатай '+n+' символов подряд без ошибки.',s=>s.bestCombo>=n));
[2,5,14,21,30].forEach(n=>add('streak-'+n,'Привычка побеждать: '+n,'Практикуйся '+n+' дней подряд.',s=>s.streak>=n));
[5,10,15,20,30].forEach(n=>add('level-'+n,'Новая высота: '+n,'Достигни '+n+'-го уровня.',s=>G.Progress.level(s)>=n));
[3,5,10,15,23].forEach(n=>add('collection-'+n,'Свой стиль: '+n,'Собери '+n+' предметов оформления.',s=>G.data.shop.filter(i=>s.owned.includes(i.id)).length>=n));
add('career-district','Первый трудовой договор','Устройся в районную редакцию.',s=>G.Career.index(s)>=1);
add('career-city','Город читает тебя','Получи приглашение в большую редакцию.',s=>G.Career.index(s)>=2);
[1,2,3,4].forEach(stage=>add('shelf-'+stage,'Полная полка: '+G.data.newsStages[stage].name,'Опубликуй все материалы раздела «'+G.data.newsStages[stage].name+'».',s=>G.data.news.filter(n=>n.stage===stage).every(n=>s.archive.includes(n.id))));
add('final-edition','Большие истории начинаются с тебя','Пройди все уроки и опубликуй все новости.',s=>G.Career.finished(s));

G.checkAchievements=s=>{const got=[];for(const [id,title,,test]of G.data.achievements)if(!s.achievements.includes(id)&&test(s)){s.achievements.push(id);s.coins+=20;got.push(title);}return got;};
})(EditorGame);