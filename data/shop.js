'use strict';
(function (G) {
  G.data.handSkins = [
    {id:'hands-gloves',name:'Чёрные перчатки',description:'Мягкая кожа и аккуратные швы. Для ночной смены.',price:260},
    {id:'hands-skeleton',name:'Костяной наборщик',description:'Кисти скелета: даже вечность начинается с первой строки.',price:480},
    {id:'hands-robot',name:'Механические руки',description:'Металлические пальцы и светящиеся детали.',price:550},
    {id:'hands-knit',name:'Уютные перчатки',description:'Тёплая вязка для длинных зимних историй.',price:320},
    {id:'hands-cosmic',name:'Звёздные руки',description:'Созвездия и туманности на кончиках пальцев.',price:650}
  ];
  G.data.avatars = [
    {id:'avatar-reporter',name:'Репортёр',description:'Всегда в центре новой истории.',price:100},
    {id:'avatar-editor',name:'Главный редактор',description:'Опыт, спокойствие и взгляд поверх очков.',price:160},
    {id:'avatar-photographer',name:'Фотокорреспондент',description:'Замечает самый важный момент.',price:130},
    {id:'avatar-artist',name:'Иллюстратор',description:'Добавляет в газету немного цвета.',price:130},
    {id:'avatar-cat',name:'Редакционный кот',description:'Главный по тёплым клавиатурам.',price:180},
    {id:'avatar-owl',name:'Ночная сова',description:'Лучшие идеи приходят после полуночи.',price:180},
    {id:'avatar-robot',name:'Бот-редактор',description:'Доброе железное сердце и точные формулировки.',price:220},
    {id:'avatar-fox',name:'Хитрый корреспондент',description:'Найдёт новость даже в тихом лесу.',price:220}
  ];
  // Starter cosmetics are always owned and do not count as purchases.
  G.data.defaultCosmetics = [
    {id:'theme-default',group:'theme',isDefault:true,name:'Стандартная тема',description:'Знакомая редакция: синие панели, светлая бумага и зелёные акценты.',price:0,colors:['#132c49','#edf2f9','#51e37c']},
    {id:'hands-default',group:'hands',isDefault:true,name:'Обычные руки',description:'Классические руки без перчаток с привычной анимацией печати.',price:0},
    {id:'avatar-default',group:'avatar',isDefault:true,name:'Начальный аватар',description:'Тот самый помощник редактора, с которого начинается история.',price:0,image:'assets/icons/editor.webp'}
  ];
  G.data.shop = [
    ...G.data.themes.map(item => ({...item,group:'theme'})),
    ...G.data.handSkins.map(item => ({...item,group:'hands'})),
    ...G.data.avatars.map(item => ({...item,group:'avatar',image:'assets/avatars/'+item.id+'.webp'}))
  ];
})(EditorGame);
