'use strict';
(function(G){
 G.NewsLibrary={
  render(s,development,archive=false){
   const U=G.UI,items=G.data.news.filter(n=>!archive||development||s.archive.includes(n.id));
   if(!items.length)return '<div class="empty">'+U.icon('cat')+'<h3>Первая полоса пока чиста</h3><p>Опубликуй новость, чтобы сохранить её здесь.</p><button data-action="news">В редакцию</button></div>';
   return G.data.newsStages.map(stage=>{
    const stories=items.filter(n=>n.stage===stage.id);if(!stories.length)return '';
    const fullStage=G.data.news.filter(n=>n.stage===stage.id),lengths=fullStage.map(n=>n.length);
    return '<section class="news-shelf" data-news-stage="'+stage.id+'"><div class="news-shelf-heading"><h3>'+stage.name+'</h3><span>'+G.Career.stages[stage.id>=2?2:1].name+' · Уровень '+stage.minLevel+' · '+Math.min(...lengths)+'–'+Math.max(...lengths)+' знаков</span></div><div class="news-grid">'+stories.map(n=>{
     const ok=(s.office||development)&&G.Progress.canNews(s,n),earned=s.archive.includes(n.id);
     const requirements=[];
     if(G.Career.index(s)<G.Career.required(n))requirements.push(G.Career.stages[G.Career.required(n)].name);
     if(G.Progress.level(s)<n.minLevel)requirements.push('уровень '+n.minLevel);
     if(s.lesson<n.minLesson)requirements.push('урок '+(n.minLesson+1));
     const preview=n.text.length>170?n.text.slice(0,n.text.lastIndexOf(' ',170))+'…':n.text;
     return '<article class="news-card" data-news-id="'+n.id+'"><img src="assets/icons/cat.webp" alt=""><div class="news-card-content"><small>'+U.escape(n.category)+(archive?' · '+(earned?'Опубликовано':'Ещё не опубликовано'):'')+'</small><h3>'+U.escape(n.title)+'</h3><div class="news-meta"><span>'+n.length+' знаков</span><span>Дедлайн '+U.time(n.deadline*1000)+'</span><span>'+n.reward.coins+' монет</span></div><p>'+U.escape(preview)+'</p>'+
     (archive?'<details class="news-full-text"><summary>Прочитать статью</summary><p>'+U.escape(n.text)+'</p></details>':'')+
     (!ok&&!archive?'<p class="news-requirements">Для работы нужны: '+U.escape(requirements.join(', '))+'.</p>':'')+
     (!archive||development?'<button data-action="news-task" data-id="'+n.id+'" '+(ok?'':'disabled')+'>'+(ok?(development?'Взять в работу':'Взять в работу · 1 энергия'):'Откроется позже')+'</button>':'')+'</div></article>';
    }).join('')+'</div></section>';
   }).join('');
  }
 };
})(EditorGame);
