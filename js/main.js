'use strict';
(function(){const game=new EditorGame.Game();game.init().catch(error=>{console.error(error);EditorGame.UI.toast('Не удалось запустить игру. Обнови страницу.');});})();