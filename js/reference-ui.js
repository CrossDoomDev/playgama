'use strict';
(function (G) {
  const U = G.UI;
  const symbols = {
    document: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
    office: '<path d="M3 9h18v12H3zM8 9V5h8v4M3 14h18M10 13v3h4v-3"/>',
    shop: '<path d="M4 11v10h16V11M2 11l3-7h14l3 7M9 21v-7h6v7"/><path d="M2 11c2 3 4 3 6 0 2 3 4 3 6 0 2 3 4 3 8 0"/>',
    archive: '<path d="M4 4h16v5H4zM6 9v12h12V9M9 13h6"/>',
    star: '<path d="m12 2 3 6.5 7 1-5 5 1.2 7-6.2-3.3L5.8 22 1 15l-5-5 7-1z" transform="translate(2 0) scale(.85 1)"/>',
    award: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.9l-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>',
    calendar: '<rect x="3" y="5" width="18" height="17" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h2m3 0h2m3 0h1M7 18h2m3 0h2"/>',
    gear: '<path d="m10 2-.6 3-2 .9-2.6-1.5-2 3.4L5 10v3l-2.2 2.2 2 3.4L7.4 17l2 .9.6 3h4l.6-3 2-.9 2.6 1.6 2-3.4L19 13v-3l2.2-2.2-2-3.4L16.6 6l-2-.9L14 2z"/><circle cx="12" cy="11.5" r="3"/>',
    clock: '<circle cx="12" cy="14" r="8"/><path d="M12 6V2M9 2h6M18 7l2-2M12 10v5l3 2"/>',
    speed: '<path d="M4 20a10 10 0 1 1 16 0M12 14l5-6M5 12l2 1M7 6l1 2M15 4l-1 2"/><circle cx="12" cy="15" r="1"/>',
    target: '<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4"/><path d="m11 13 9-10M17 3h4v4"/>',
    cross: '<path d="m5 5 14 14M19 5 5 19"/>',
    book: '<path d="M12 6C8 3 4 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-4-1-7 0-10 2v15"/>'
  };
  U.symbol = (name, cls = '') =>
    '<svg class="ui-symbol ' + cls + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (symbols[name] || symbols.document) + '</svg>';

  U.header = function (s) {
    const level = G.Progress.level(s);
    document.querySelector('#header').innerHTML =
      '<button class="profile-card" data-action="profile" aria-label="Открыть профиль и статистику игрока" aria-haspopup="dialog">' +
        '<img class="profile-avatar" src="' + G.Cosmetics.avatar(s) + '" alt="Аватар игрока">' +
        '<span class="profile-details"><b>' + G.Career.current(s).role + '</b>' +
        '<span>' + G.Career.current(s).paper + '</span>' +
        '<span class="profile-level">Ур. ' + level + '<progress value="' + s.xp % 150 + '" max="150"></progress></span></span>' +
      '</button>' +
      '<div class="hud-card energy-card">' + this.icon('energy') +
        '<div class="energy-content"><span>Энергия</span><div class="energy-line"><progress id="energy-meter" value="' + s.energy + '" max="'+G.Energy.MAX+'"></progress><b id="energy-value">' + s.energy + '/'+G.Energy.MAX+'</b></div><small>Восстановление: <span id="energy-time"></span></small></div>' +
        '<button class="mini" data-action="energy" aria-label="Получить энергию">+</button></div>' +
      '<div class="hud-card wallet-card">' + this.icon('coin') + '<span>Монеты<b>' + s.coins + '</b></span></div>' +
      '<div class="hud-card xp-card">' + this.symbol('award', 'gold-star') + '<span>Опыт<b>' + s.xp + '</b></span></div>' +
      '<button class="hud-card streak-card" data-action="daily">' + this.symbol('calendar', 'calendar-icon') + '<span>Серия дней<b>' + s.streak + '</b></span></button>' +
      '<div class="hud-actions"><button class="hud-square gift-button" data-action="gift" aria-label="Ежедневный подарок">' + this.icon('gift') + (s.giftDate !== G.Daily.day() ? '<i class="notification-dot"></i>' : '') + '</button>' +
      '<button class="hud-square settings" data-action="settings" aria-label="Настройки">' + this.symbol('gear') + '</button></div>';
  };

  U.nav = function (active, s) {
    const links = [['home', 'Текущая задача', 'document'], ['lessons', 'Обучение', 'book'], ['news', 'Редакция', 'office'], ['shop', 'Магазин', 'shop'], ['archive', 'Коллекции', 'archive'], ['achievements', 'Достижения', 'award']];
    document.querySelector('#nav').innerHTML =
      '<div class="newspaper-sign"><b>'+G.Career.current(s).paper+'</b><span>'+G.Career.current(s).subtitle+'</span></div>' +
      '<div class="nav-links">' + links.map(([id, label, icon]) =>
        '<button data-action="' + id + '" class="' + (id === active ? 'selected' : '') + '">' +
        this.symbol(icon) + '<span>' + label + '</span></button>').join('') + '</div>' +
      '<div class="desk-sticky"><span>Быстрые пальцы —<br>большие<br>возможности!</span><span class="sticky-smile">☺</span></div>';
  };

  U.workstation = function (task, s) {
    const active = !!task;
    const lesson = task?.lesson || G.data.lessons[s.lesson];
    const news = task?.kind === 'news';
    const title = news ? task.news.title : !active && s.office ? 'Новый день в редакции' : lesson.title;
    const category = news ? task.news.category : s.office ? (active ? 'Практика в редакции' : 'Рабочий день') : 'Домашняя тренировка';
    const source = !active && s.office ? '<div class="lesson-copy"><p>На столе ждут новые истории. Выбери материал в разделе «Редакция» и подготовь его к публикации.</p><p class="lesson-footnote">'+this.escape(G.Career.goal(s))+'</p></div>' : news
      ? '<div class="article-copy" id="source-text" aria-label="Набранный текст статьи"></div>'
      : '<div class="lesson-copy"><p>' + this.escape(lesson.tip) + '</p><div class="home-row-guide"><span>ЛЕВАЯ РУКА<b>Ф Ы В А</b></span><span>ПРАВАЯ РУКА<b>О Л Д Ж</b></span></div><p class="lesson-footnote">Сначала точность, потом скорость. Возвращай пальцы на домашний ряд и смотри на экран.</p></div>';
    const stats = active
      ? '<div class="side-timer"><div>' + this.symbol('clock') + '<span>' + (news ? 'Осталось времени' : 'Спокойный темп') + '</span></div><div class="timer-line"><progress id="deadline-meter" max="' + (news ? task.news.deadline : 1) + '" value="' + (news ? task.news.deadline : 1) + '"></progress><b id="clock">' + (news ? this.time(task.news.deadline * 1000) : '∞') + '</b></div></div>' +
        '<h3>Статистика</h3><div class="side-stat">' + this.symbol('speed', 'stat-green') + '<span>Скорость</span><b><span id="speed">0</span> <small>зн/мин</small></b></div>' +
        '<div class="side-stat">' + this.symbol('target', 'stat-green') + '<span>Точность</span><b class="stat-green" id="accuracy">100%</b></div>' +
        '<div class="side-stat">' + this.symbol('cross', 'stat-red') + '<span>Ошибки</span><b class="stat-red" id="errors">0</b></div>' +
        '<div class="side-stat combo-stat">' + this.symbol('award') + '<span>Серия</span><b id="combo">0</b></div>' +
        ('<h3>Награда за выполнение</h3><div class="reward-preview">' + this.icon('coin') + '<span>+ ' + (news ? task.news.reward.coins : '15') + '</span></div><div class="reward-preview">' + this.symbol('award', 'gold-star') + '<span>+ ' + (news ? task.news.reward.xp : '25') + ' опыта</span></div><small class="reward-explanation">Бонусы за точность и скорость</small>')
      : '<h3>Планы на сегодня</h3><div class="daily-progress"><b>' + Math.min(3, s.daily.tasks) + ' / 3</b><span>успешных задания</span><progress max="3" value="' + s.daily.tasks + '"></progress></div><p>Каждая тренировка приближает первую полосу.</p><button data-action="daily">Награда за практику</button><h3>Следующая цель</h3><p>' + (G.Development?.enabled ? 'Все уроки, новости и предметы открыты. Выбирай любой раздел в меню.' : G.Career.goal(s)) + '</p>';
    return '<section class="desk-layout">' +
      '<div class="monitor ' + (active ? 'active' : 'idle') + '">' +
        '<div class="task-head"><span>' + this.symbol('document') + this.escape(category) + (active && G.Development?.enabled ? '<b class="development-badge">Разработка</b>' : '') + '</span><span class="task-number">' + (news ? 'Заметка ' + (task.news.id + 1) + '/' + (G.Development?.enabled ? G.data.news.length : G.data.news.filter(item => item.available).length) : !active && s.office ? 'Карьера ' + (G.Career.index(s)+1) + '/3' : 'Урок ' + (lesson.id + 1) + '/' + G.data.lessons.length) + '</span></div>' +
        '<div class="paper-sheet"><div class="article-layout '+(news?'news-layout':'')+'"><article><h2>' + this.escape(title) + '</h2>' + source + '</article>' +
        '<figure class="article-illustration ' + (news ? 'news-picture' : '') + '"><img src="assets/icons/' + (news ? 'cat' : 'editor') + '.webp" alt="' + (news ? 'Иллюстрация новости' : 'Начинающий редактор') + '"><figcaption>' + (news ? 'ВЫМЫШЛЕННАЯ ИСТОРИЯ' : s.office ? 'ГОТОВИМ НОВЫЙ ВЫПУСК' : 'ТВОЯ ИСТОРИЯ НАЧИНАЕТСЯ') + '</figcaption></figure></div>' +
        (active ? '<div class="typing-strip"><div id="typing-text" aria-label="Текст для набора"></div></div><div class="paper-footer"><span id="position"></span><progress id="task-progress" max="' + task.text.length + '" value="0"></progress><button class="small" data-action="pause">Пауза · Esc</button></div>' :
        s.office ? '<div class="lesson-start"><span>'+this.escape(G.Career.current(s).paper)+'</span><button class="primary" data-action="news">Выбрать новость →</button><small>1 энергия за материал</small></div>' : '<div class="lesson-start"><span>Новые клавиши: <b>' + this.escape(lesson.added || 'повторение') + '</b></span><button class="primary" data-action="train">Начать упражнение →</button><small>1 энергия за попытку</small></div>') +
        '</div></div>' +
      '<aside class="task-sidebar">' + stats + '<div class="good-news-note" aria-hidden="true">Хорошие новости<br>делают день<br>лучше! <span>☺</span></div></aside>' +
      '<div class="keyboard-wrap"><div id="keyboard"></div></div>' +
      '</section>';
  };

  const keepCaretVisible = article => {
    const cursor=article?.querySelector('.article-caret');if(!cursor)return;
    const caret=cursor.getBoundingClientRect(),box=article.getBoundingClientRect();
    if(caret.bottom>box.bottom-8)article.scrollTop+=caret.bottom-box.bottom+8;
    else if(caret.top<box.top+4)article.scrollTop+=caret.top-box.top-4;
  };
  let observedArticle=null;
  const articleObserver=new ResizeObserver(entries=>entries.forEach(entry=>keepCaretVisible(entry.target)));

  const originalTyping = U.typing.bind(U);
  U.typing = function (engine) {
    originalTyping(engine);
    const article = document.querySelector('#source-text');
    if (article) {
      if(article._engine!==engine){
        article.innerHTML='<span class="article-typed"></span><span class="article-mistake"></span><span class="article-caret" aria-hidden="true"></span>';
        article._engine=engine;article._displayed=null;
      }
      const mistake=engine.bad?engine.wrongKey:'';
      const displayed=engine.position+'|'+mistake;
      if(article._displayed!==displayed){
        article.querySelector('.article-typed').textContent=engine.text.slice(0,engine.position);
        article.querySelector('.article-mistake').textContent=G.I18n.userText(mistake);
        article._displayed=displayed;
        const caret=article.querySelector('.article-caret').getBoundingClientRect(),box=article.getBoundingClientRect();
        if(caret.top<box.top+4||caret.bottom>box.bottom-8)
          article.scrollTop+=caret.top-box.top-Math.max(0,box.height/3);
      }
    }
  };

  // A single observer follows the changing central column at every supported size.
  const resizeKeyboard = () => {
    const article=document.querySelector('#source-text');if(article!==observedArticle){if(observedArticle)articleObserver.unobserve(observedArticle);observedArticle=article;if(article)articleObserver.observe(article);}
    const keyboard = document.querySelector('#keyboard');
    if (!keyboard) return;
    const scale = keyboard.parentElement.clientWidth / 760;
    keyboard.style.transform = 'scale(' + scale + ')';
    keyboard.parentElement.style.setProperty('--keyboard-height', 226 * scale + 'px');
  };
  new ResizeObserver(resizeKeyboard).observe(document.querySelector('#main'));
  new MutationObserver(resizeKeyboard).observe(document.querySelector('#main'), { childList: true });
  window.addEventListener('resize', resizeKeyboard);
})(EditorGame);
