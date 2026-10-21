'use strict';
(function (G) {
  const fields = {theme:'theme',hands:'handSkin',avatar:'avatar'};
  const labels = {theme:'Темы',hands:'Скины рук',avatar:'Аватары'};
  // Preserve earlier purchases as equivalent cosmetic items when the old catalog retires.
  const legacy = {mug:'avatar-cat',lamp:'theme-amber',mat:'theme-ocean',office:'hands-gloves',modern:'theme-neon',poster:'avatar-reporter',plant:'avatar-owl'};
  const C = G.Cosmetics = {
    fields,
    normalize(s) {
      s.owned = [...new Set((s.owned || []).map(id => legacy[id] || id))].filter(id => G.data.shop.some(item => item.id === id));
      for (const [group, field] of Object.entries(fields)) {
        const item = G.data.shop.find(item => item.id === s[field] && item.group === group);
        if (!item || !s.owned.includes(item.id)) s[field] = 'default';
      }
      s.keyboard = 'classic';
      return s;
    },
    avatar(s) {
      return G.data.shop.find(item => item.group === 'avatar' && item.id === s.avatar)?.image || 'assets/icons/editor.webp';
    },
    apply(s) {
      document.documentElement.dataset.theme = s.theme || 'default';
      document.querySelector('#app').dataset.keyboard = 'classic';
    },
    equip(s, id) {
      const item = G.data.shop.find(item => item.id === id);
      if (!item || !s.owned.includes(id)) return false;
      s[fields[item.group]] = id;
      return true;
    },
    reset(s, group) {
      if (!fields[group]) return false;
      s[fields[group]] = 'default';
      return true;
    },
    preview(item) {
      const U = G.UI;
      if (item.group === 'avatar') return '<div class="cosmetic-preview avatar-preview"><img src="'+item.image+'" alt="'+U.escape(item.name)+'" loading="lazy"></div>';
      if (item.group === 'hands' && item.isDefault) return '<div class="cosmetic-preview hands-preview"><img alt="" src="assets/hands/left-whole.webp"><img alt="" src="assets/hands/right-whole.webp"></div>';
      if (item.group === 'hands') return '<div class="cosmetic-preview hands-preview"><img data-hand-skin="'+item.id+'" data-side="left" alt="" src="assets/hands/left-whole.webp"><img data-hand-skin="'+item.id+'" data-side="right" alt="" src="assets/hands/right-whole.webp"></div>';
      return '<div class="cosmetic-preview theme-preview" style="--sample-panel:'+item.colors[0]+';--sample-paper:'+item.colors[1]+';--sample-accent:'+item.colors[2]+'"><div class="sample-top"><i></i><b></b><b></b></div><div class="sample-desk"><aside><i></i><i></i><i></i></aside><div class="sample-screen"><div class="sample-head"></div><div class="sample-paper"><b></b><i></i><i></i><em></em></div><div class="sample-keyboard">'+Array(24).fill('<i></i>').join('')+'</div></div></div><span class="theme-swatches">'+item.colors.map(color=>'<i style="background:'+color+'"></i>').join('')+'</span></div>';
    },
    shop(s, group, development) {
      const U = G.UI;
      if (!fields[group]) group = 'theme';
      const catalog = [...G.data.defaultCosmetics, ...G.data.shop];
      const items = catalog.filter(item => item.group === group);
      const current = s[fields[group]] || 'default';
      const tabs = '<div class="cosmetic-tabs" role="group" aria-label="Категории магазина">'+Object.keys(fields).map(key=>'<button data-action="shop-category" data-id="'+key+'" class="'+(key===group?'selected':'')+'" aria-pressed="'+(key===group)+'">'+labels[key]+' <span>'+catalog.filter(item=>item.group===key).length+'</span></button>').join('')+'</div>';
      return tabs+'<div class="cosmetic-grid">'+items.map(item=>{
        const owned = item.isDefault || s.owned.includes(item.id), selected = current===(item.isDefault ? 'default' : item.id);
        const free = development && s.coins<item.price;
        const action = selected?'Выбрано':owned?'Применить':free?'Получить и применить':'Купить · '+item.price;
        return '<article class="cosmetic-card '+(selected?'equipped':'')+'" data-product="'+item.id+'">'+C.preview(item)+'<div class="cosmetic-card-copy"><small class="cosmetic-status">'+(item.isDefault?'Бесплатно · Всегда доступно':selected?'Сейчас используется':owned?'В коллекции':item.price+' монет')+'</small><h3>'+U.escape(item.name)+'</h3><p>'+U.escape(item.description)+'</p><button data-action="'+(item.isDefault?'cosmetic-default':'buy')+'" data-id="'+(item.isDefault?group:item.id)+'" '+(selected||(!owned&&!development&&s.coins<item.price)?'disabled':'')+'>'+action+'</button></div></article>';
      }).join('')+'</div>';
    }
  };
})(EditorGame);
