'use strict';
(function(G){
const day=(date=new Date())=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
G.Daily={day,
refresh(s,date=new Date()){const today=day(date);if(s.daily.date!==today)s.daily={date:today,tasks:0,chars:0,news:0,claimed:false};const yesterday=new Date(date);yesterday.setDate(yesterday.getDate()-1);if(s.lastPractice!==today&&s.lastPractice!==day(yesterday))s.streak=0;},
practice(s,chars,news,date=new Date()){this.refresh(s,date);const today=day(date),y=new Date(date);y.setDate(y.getDate()-1);if(s.lastPractice!==today){s.streak=s.lastPractice===day(y)?s.streak+1:1;s.lastPractice=today;}s.daily.tasks++;s.daily.chars+=chars;if(news)s.daily.news++;},
gift(s,date=new Date()){if(s.giftDate===day(date))return null;const i=s.giftIndex%7;const names=['50 монет','1 энергия','100 монет','75 опыта','Аватар «Редакционный кот»','2 энергии','Тема «Неоновая смена»'];if(i===0)s.coins+=50;if(i===1)G.Energy.add(s);if(i===2)s.coins+=100;if(i===3)s.xp+=75;if(i===4&&!s.owned.includes('avatar-cat'))s.owned.push('avatar-cat');if(i===5)G.Energy.add(s,2);if(i===6&&!s.owned.includes('theme-neon'))s.owned.push('theme-neon');s.giftDate=day(date);s.giftIndex++;return names[i];},
claim(s){if(s.daily.tasks<3||s.daily.claimed)return false;s.daily.claimed=true;s.coins+=100;s.xp+=50;return true;}
};
})(EditorGame);