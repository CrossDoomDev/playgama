'use strict';
(function(G){
const copy=value=>JSON.parse(JSON.stringify(value));
const ru={lessons:G.data.lessons,news:G.data.news,stages:copy(G.data.newsStages),career:copy(G.Career.stages),scenes:copy(G.Career.scenes),achievements:G.data.achievements.map(a=>a.slice())};
const catalogs=['themes','shop','handSkins','avatars','defaultCosmetics'];
for(const key of catalogs)ru[key]=copy(G.data[key]);
const words=G.EnglishUI;
const added=['asdf','jkl;','','gh',' ','rt','yu','ei','wo','qp','vb','nm','c,','x.','z/','[]',"'-",'',',.','"?',':;','12','34','56','78','90'];
const names=['First Touch','Right Hand','Both Hands','Index Fingers','First Space','Top Center','Right Top Center','Middle Fingers Above','Ring Fingers Above','Top Edges','Bottom Center','Right Bottom Center','Middle Fingers Below','Ring Fingers Below','Bottom Edges','Square Brackets','Apostrophe and Hyphen','Capital Letters','Comma and Period','Quotes and Question','Colon and Semicolon','Numbers: Start','Numbers: Left','Numbers: Center','Numbers: Right','Numbers: Edge'];
const stories=['A pigeon brought a note to the newsroom. It asked for fair weather, fresh crumbs, and a careful review before publication.','The newsroom cat sat on the final page before deadline. The team checked every headline around its paws and printed on time.','The old elevator wished every passenger a good morning. By lunch it had received four replies and a thank you card.','Neighbors organized a small parade with one banner, two musicians, and a dog who joined by accident.','A teaspoon vanished from the kitchen. Reporters found it beside the printer, holding a loose tray in place.','One office window reported rain while all the others showed sunshine. A watering can on the roof explained the forecast.','The library issued its first card to a sparrow. The reader chose a book about long journeys.','A city bus waited for a turtle crossing the road. The passengers applauded when it reached the other side.','A group of cacti performed a silent concert in the park. The audience praised every pause.','The bakery posted its morning bulletin. Warm rolls were ready and the kettle was singing.'];
function lessons(){let keys='';return added.map((a,id)=>{keys+=a;return{id,title:names[id],added:a,tip:'Keep your eyes on the screen and return your fingers to the home row.',keys,uppercase:id>=17,accuracy:id<5?90:93,minSpeed:id>=18?35:0};});}
function english(){const ls=lessons();G.data.lessons=ls;G.data.news=ru.news.map((n,id)=>{let text=id<5?['dad had a salad','a lad had a flask','fall salad fall','dad asks a lad','a flask falls'][id]:stories[id%stories.length];if(id>19)text=(text+' '+stories[(id+3)%10]+' '+(n.stage>2?stories[(id+6)%10]:'')).trim();const l=ls.find(x=>[...text].every(c=>x.keys.includes(c.toLowerCase())&&(c===c.toLowerCase()||x.uppercase)))||ls[25];return{...n,title:['The Patient Pigeon','A Cat on Deadline','The Polite Elevator','A Small Parade','The Missing Teaspoon','Rain for One Window','The Library Reader','The Bus That Waited','A Quiet Concert','The Bakery News'][id%10]+' '+(id+1),category:['Newsroom Life','City Life','Good News','Culture','Neighborhood'][n.stage],text,length:text.length,minLesson:l.id,rarity:id%3?'Common':'Rare'};});G.data.newsStages.forEach((x,i)=>x.name=['First Notes','City Stories','Reports','Features','Special Editions'][i]);const c=[['Home Training','My Room','Trainee Editor','Touch Typing School'],['District Newsroom','Bright City','Assistant Editor','District Newspaper'],['City Newsroom','Big City','Editor','City Newspaper']];G.Career.stages.forEach((x,i)=>[x.name,x.paper,x.role,x.subtitle]=c[i]);for(const key of catalogs)G.data[key]=translateData(ru[key]);
G.Career.scenes=translateData(ru.scenes);
G.data.achievements=ru.achievements.map(([id,title,description,test])=>{
 if(id.startsWith('lesson-')){const l=ls[Number(id.slice(7))];return [id,'Lesson '+(l.id+1)+': '+l.title,'Successfully complete "'+l.title+'".',test];}
 if(id.startsWith('shelf-')){const stage=G.data.newsStages[Number(id.slice(6))];return [id,'Full Shelf: '+stage.name,'Publish every story in "'+stage.name+'".',test];}
 if(id.startsWith('level-'))description='Reach level '+id.slice(6)+'.';
 return [id,t(title),t(description),test];
});}

// Unknown source phrases remain visible and are reported by the localization audit.
// Never hide or delete an untranslated message.
const missing=new Set();
function t(value){
 const v=String(value??'');if(I.language!=='en')return v;
 if(Object.prototype.hasOwnProperty.call(words,v))return words[v];
 return v.replace(/[А-Яа-яЁё]+(?:[ \t]+[А-Яа-яЁё]+)*/g,phrase=>{
  if(Object.prototype.hasOwnProperty.call(words,phrase))return words[phrase];
  missing.add(phrase);return phrase;
 });
}
function translateData(value){
 if(typeof value==='string')return t(value);
 if(Array.isArray(value))return value.map(translateData);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,translateData(v)]));
 return value;
}
const attributes=['title','alt','aria-label','aria-description','placeholder'];
function scan(root){
 if(I.language!=='en'||!root)return;
 if(root.nodeType===3){if(root.parentElement?.closest('script,style'))return;const raw=root.nodeValue,trim=raw.trim(),out=t(trim);if(out!==trim)root.nodeValue=raw.replace(trim,out);return;}
 if(root.nodeType!==1||root.matches('script,style'))return;
 for(const attr of attributes){if(root.hasAttribute(attr)){const raw=root.getAttribute(attr),out=t(raw);if(raw!==out)root.setAttribute(attr,out);}}
 for(const child of root.childNodes)scan(child);
}
const romanLetters={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
function romanize(value){return String(value).replace(/[А-Яа-яЁё]/g,c=>{const s=romanLetters[c.toLowerCase()];return c===c.toLowerCase()?s:s.charAt(0).toUpperCase()+s.slice(1);});}
const I=G.I18n={
 language:'ru',missing,t,scan,
 // Player names and saved Russian key labels are user data, not UI translation keys.
 userText:value=>I.language==='en'?romanize(value):String(value),
 keyLabel:key=>key===' '?t('Пробел'):I.language==='en'&&/[А-Яа-яЁё]/.test(key)?'RU '+romanize(key).toUpperCase():key.toUpperCase(),
 setLanguage(v){
  this.language=String(v||'ru').toLowerCase().split('-')[0]==='ru'?'ru':'en';missing.clear();
  document.documentElement.lang=this.language;document.title=this.language==='en'?'News Editor':'Редактор новостей';
  G.data.newsStages=copy(ru.stages);G.Career.stages=copy(ru.career);
  if(this.language==='en')english();
  else{G.data.lessons=ru.lessons;G.data.news=ru.news;G.Career.scenes=copy(ru.scenes);G.data.achievements=ru.achievements.map(a=>a.slice());for(const key of catalogs)G.data[key]=copy(ru[key]);}
  scan(document.body);document.dispatchEvent(new CustomEvent('game-language-change',{detail:{language:this.language}}));
 }
};
new MutationObserver(records=>{
 if(I.language!=='en')return;
 for(const record of records){
  if(record.type==='attributes'||record.type==='characterData')scan(record.target);
  else for(const node of record.addedNodes)scan(node);
 }
}).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attributes});
})(EditorGame);
