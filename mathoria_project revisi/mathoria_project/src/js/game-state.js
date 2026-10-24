'use strict';
// game-state.js


const SAVE_KEY='mathoria.odyssey.v3';
const SHOP=[
 {id:'mori',name:'Mori Hutan',price:0,color:'#9ce8b6',scarf:'#ff927c',tag:'Teman pertamamu'},
 {id:'astro',name:'Mori Kosmik',price:150,color:'#b3b8ff',scarf:'#72e2ff',tag:'Untuk penjelajah bintang'},
 {id:'sunny',name:'Mori Mentari',price:180,color:'#ffdf8f',scarf:'#f59bca',tag:'Bawa semangat hangat'},
 {id:'ocean',name:'Mori Samudra',price:220,color:'#83e4ec',scarf:'#7778ef',tag:'Setenang ombak biru'},
 {id:'berry',name:'Mori Beri',price:280,color:'#e5b0f3',scarf:'#cf70ae',tag:'Petualangan penuh warna'},
 {id:'royal',name:'Mori Aurora',price:400,color:'#e6ebff',scarf:'#9b7bfa',tag:'Cahaya langit utara',crown:true},
];
const ACHIEVEMENTS=[
 {id:'first',name:'Langkah Pertama',text:'Selesaikan satu misi petualangan.',icon:'flag',reward:25},
 {id:'island',name:'Penjaga Pulau',text:'Selesaikan lima wahana pada satu jalur.',icon:'shield',reward:100},
 {id:'arcade',name:'Bintang Arcade',text:'Selesaikan satu sesi arcade.',icon:'play',reward:25},
 {id:'curious',name:'Rasa Ingin Tahu',text:'Jawab tepat 20 tantangan.',icon:'bulb',reward:40},
 {id:'wardrobe',name:'Gaya Baruku',text:'Miliki tiga kostum Mori.',icon:'bag',reward:50},
 {id:'allmodes',name:'Serba Bisa',text:'Mainkan ketiga mode arcade.',icon:'grid',reward:60},
 {id:'streak',name:'Kembali Bertualang',text:'Bermain pada tiga hari berbeda.',icon:'spark',reward:60},
 {id:'scholar',name:'Lintas Dunia',text:'Selesaikan misi pada tiga jalur belajar.',icon:'book',reward:75},
];
const DAILY=[
 {id:'answers',title:'Pecahkan 5 tantangan',target:5,reward:40,icon:'bulb'},
 {id:'mission',title:'Nyalakan satu lentera',target:1,reward:60,icon:'flag'},
 {id:'arcade',title:'Selesaikan satu arcade',target:1,reward:45,icon:'play'},
];
function dayStamp(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
const clone=x=>JSON.parse(JSON.stringify(x));
const number=(n,max=1e7)=>Number.isFinite(n)?Math.min(max,Math.max(0,Math.floor(n))):0;
function freshProgress(today=dayStamp()){
 return {version:3,name:'Penjelajah',track:'c',onboarded:false,skin:'mori',owned:['mori'],coins:0,totalCoins:0,xp:0,completed:{},sessions:{},achievements:[],stats:{answers:0,arcadeRuns:0,arcadeModes:[],activeDates:[],bests:{runner:0,bubbles:0,memory:0}},daily:{date:today,answers:0,mission:0,arcade:0,claimed:[]},preferences:{sound:true,motion:true,calm:true,text:'normal'},lastResult:null};
}
function normalizeProgress(raw,today=dayStamp()){
 const s=freshProgress(today);if(!raw||typeof raw!=='object'||Array.isArray(raw))return s;
 s.name=String(raw.name||'Penjelajah').trim().slice(0,24)||'Penjelajah';
 s.track=TRACKS.some(t=>t.id===raw.track)?raw.track:'c';s.onboarded=!!raw.onboarded;
 s.owned=[...new Set(['mori',...(Array.isArray(raw.owned)?raw.owned:[]).filter(id=>SHOP.some(i=>i.id===id))])];
 s.skin=s.owned.includes(raw.skin)?raw.skin:'mori';s.coins=number(raw.coins);s.totalCoins=Math.max(s.coins,number(raw.totalCoins));
 for(const [key,value]of Object.entries(raw.completed||{})){
  const [track,game]=key.split(':');
  if(TRACKS.some(t=>t.id===track)&&GAMES.some(g=>g.id===game)&&value&&typeof value==='object')s.completed[key]={track,game,stars:Math.max(1,Math.min(3,number(value.stars||3))),attempts:number(value.attempts),hints:number(value.hints),firstCompleted:String(value.firstCompleted||''),lastCompleted:String(value.lastCompleted||''),playCount:Math.max(1,number(value.playCount)),independent:!!value.independent};
 }
 s.xp=Object.keys(s.completed).length*60;
 s.achievements=(Array.isArray(raw.achievements)?raw.achievements:[]).filter(id=>ACHIEVEMENTS.some(a=>a.id===id));
 const stats=raw.stats||{};
 s.stats={answers:number(stats.answers),arcadeRuns:number(stats.arcadeRuns),arcadeModes:[...new Set((Array.isArray(stats.arcadeModes)?stats.arcadeModes:[]).filter(x=>['runner','bubbles','memory'].includes(x)))],activeDates:[...new Set((Array.isArray(stats.activeDates)?stats.activeDates:[]).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)))].slice(-366),bests:Object.fromEntries(['runner','bubbles','memory'].map(k=>[k,number(stats.bests?.[k])]))};
 if(raw.daily?.date===today)s.daily={date:today,answers:number(raw.daily.answers),mission:number(raw.daily.mission),arcade:number(raw.daily.arcade),claimed:[...new Set((Array.isArray(raw.daily.claimed)?raw.daily.claimed:[]).filter(x=>['answers','mission','arcade','chest'].includes(x)))]};
 s.preferences={sound:raw.preferences?.sound!==false,motion:raw.preferences?.motion!==false,calm:raw.preferences?.calm!==false,text:raw.preferences?.text==='large'?'large':'normal'};
 const result=raw.lastResult;
 if(result&&((result.kind==='adventure'&&MISSIONS[result.track]?.[result.game])||(result.kind==='arcade'&&['runner','bubbles','memory'].includes(result.mode))))s.lastResult={kind:result.kind,track:result.track,game:result.game,mode:result.mode,title:result.kind==='adventure'?MISSIONS[result.track][result.game].title:'',first:!!result.first,coins:number(result.coins,10000),score:number(result.score),correct:number(result.correct,8),goal:result.mode==='memory'?4:8,stars:Math.max(1,number(result.stars,3)),unlocked:(Array.isArray(result.unlocked)?result.unlocked:[]).filter(id=>ACHIEVEMENTS.some(a=>a.id===id))};
 // A restored report deliberately starts fresh sessions; malformed in-flight answers never enter the UI.
 return s;
}
function restoreSessions(state,raw){
 for(const[key,s]of Object.entries(raw?.sessions||{})){
  const [track,game]=key.split(':'),m=MISSIONS[track]?.[game];
  if(!m||!s||!['brief','play','result'].includes(s.phase)||![0,1].includes(s.round))continue;
  const r=m.rounds[s.round],a=initialAnswer(r),saved=s.answer||{};
  if('selected'in a)a.selected=[...new Set((Array.isArray(saved.selected)?saved.selected:[]).filter(v=>r.type==='dice'?/^[1-6]-[1-6]$/.test(String(v)):Number.isInteger(v)&&v>=0&&v<(r.count??r.shapes?.length??0)))];
  if('order'in a)a.order=(Array.isArray(saved.order)?saved.order:[]).filter(v=>r.items.some(i=>i.id===v)).filter((v,i,arr)=>arr.indexOf(v)===i).slice(0,r.items.length);
  if('baskets'in a){let left=r.total;a.baskets=a.baskets.map((_,i)=>{const n=number(saved.baskets?.[i],left);left-=n;return n;});}
  if('counts'in a)a.counts=[number(saved.counts?.[0],100),number(saved.counts?.[1],100)];
  if('choice'in a)a.choice=(r.options||[]).some(o=>o.id===saved.choice)?saved.choice:null;
  if('marked'in a)a.marked=!!saved.marked;
  if('values'in a){a.values=a.values.map((_,i)=>String(saved.values?.[i]??'').slice(0,40));a.drawn=!!saved.drawn;}
  state.sessions[key]={track,game,phase:s.phase,round:s.round,answer:a,hint:number(s.hint,2),hints:number(s.hints),attempts:number(s.attempts),feedback:null,awarded:!!state.completed[key],correctRounds:Array.isArray(s.correctRounds)?s.correctRounds.filter(x=>x===0||x===1):[]};
 }
 return state;
}
function migrateLegacy(raw,today=dayStamp()){
 const s=normalizeProgress(raw,today);s.onboarded=!!Object.keys(s.completed).length||raw?.name!=='Penjelajah'&&!!raw?.name;
 s.coins=Object.keys(s.completed).length*100;s.totalCoins=s.coins;return s;
}
function touchDay(s,today=dayStamp()){
 if(s.daily.date!==today)s.daily={date:today,answers:0,mission:0,arcade:0,claimed:[]};
}
function markActive(s,today){if(!s.stats.activeDates.includes(today))s.stats.activeDates.push(today);}
function awardCoins(s,amount){const n=number(amount,10000);s.coins+=n;s.totalCoins+=n;return n;}
function recordCorrect(s,today=dayStamp()){touchDay(s,today);markActive(s,today);s.stats.answers++;s.daily.answers++;return unlockAchievements(s);}
function completeAdventure(s,track,game,details={},today=dayStamp()){
 if(!MISSIONS[track]?.[game])return {first:false,coins:0};
 touchDay(s,today);markActive(s,today);const key=`${track}:${game}`,old=s.completed[key],stars=details.attempts<=2?3:details.attempts<=4?2:1;
 s.completed[key]={track,game,stars:Math.max(old?.stars||0,stars),attempts:number(details.attempts),hints:number(details.hints),firstCompleted:old?.firstCompleted||today,lastCompleted:today,playCount:(old?.playCount||0)+1,independent:old?.independent||details.hints===0};
 s.xp=Object.keys(s.completed).length*60;s.daily.mission++;
 const coins=old?0:awardCoins(s,100);const unlocked=unlockAchievements(s);
 return {first:!old,coins,stars:s.completed[key].stars,unlocked};
}
function completeArcade(s,mode,score,correct,today=dayStamp()){
 if(!['runner','bubbles','memory'].includes(mode))return {coins:0,unlocked:[]};
 touchDay(s,today);markActive(s,today);s.stats.arcadeRuns++;s.daily.arcade++;if(!s.stats.arcadeModes.includes(mode))s.stats.arcadeModes.push(mode);
 s.stats.bests[mode]=Math.max(s.stats.bests[mode],number(score));
 const coins=awardCoins(s,Math.min(40,10+number(correct)*3));return {coins,unlocked:unlockAchievements(s)};
}
function claimDaily(s,id,today=dayStamp()){
 touchDay(s,today);if(s.daily.claimed.includes(id))return 0;
 const task=DAILY.find(t=>t.id===id);
 const valid=task?s.daily[id]>=task.target:id==='chest'&&DAILY.every(t=>s.daily.claimed.includes(t.id));
 if(!valid)return 0;s.daily.claimed.push(id);return awardCoins(s,task?task.reward:120);
}
function buySkin(s,id){
 const item=SHOP.find(i=>i.id===id);if(!item)return {ok:false,message:'Kostum tidak ditemukan.'};
 if(s.owned.includes(id)){s.skin=id;return {ok:true,equipped:true,unlocked:[]};}
 if(s.coins<item.price)return {ok:false,message:`Butuh ${item.price-s.coins} koin lagi. Dapatkan koin melalui misi dan arcade.`};
 s.coins-=item.price;s.owned.push(id);s.skin=id;return {ok:true,equipped:false,unlocked:unlockAchievements(s)};
}
function unlockAchievements(s){
 const done=Object.keys(s.completed),conditions={first:done.length>=1,island:TRACKS.some(t=>GAMES.every(g=>s.completed[`${t.id}:${g.id}`])),arcade:s.stats.arcadeRuns>=1,curious:s.stats.answers>=20,wardrobe:s.owned.length>=3,allmodes:s.stats.arcadeModes.length===3,streak:s.stats.activeDates.length>=3,scholar:new Set(done.map(k=>k.split(':')[0])).size>=3};
 const newly=ACHIEVEMENTS.filter(a=>conditions[a.id]&&!s.achievements.includes(a.id));
 for(const a of newly){s.achievements.push(a.id);awardCoins(s,a.reward);}return newly;
}
function createSession(track,game){return {track,game,phase:'brief',round:0,answer:initialAnswer(MISSIONS[track][game].rounds[0]),hint:0,hints:0,attempts:0,feedback:null,awarded:false,correctRounds:[]};}
function seededRandom(seed){let a=Number(seed)>>>0;return ()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const gcd=(a,b)=>b?gcd(b,a%b):a;
const frac=(a,b)=>{const d=gcd(Math.abs(a),b);return b/d===1?String(a/d):`${a/d}/${b/d}`;};
function arcadeQuestion(track='c',rng=Math.random,count=4){
 const rand=(a,b)=>a+Math.floor(rng()*(b-a+1));let answer,prompt,explain,topic,label;
 if(track==='awal'||track==='a'){
  const a=rand(1,track==='awal'?5:12),b=rand(1,track==='awal'?4:9);answer=a+b;prompt=`${a} + ${b}`;explain=`${a} ditambah ${b} sama dengan ${answer}.`;topic='Penjumlahan';
 }else if(track==='b'){
  const a=rand(2,9),b=rand(2,9);answer=a*b;prompt=`${a} × ${b}`;explain=`${a} kelompok berisi ${b} menghasilkan ${answer}.`;topic='Perkalian';
 }else if(track==='c'){
  const den=[4,6,8,10][rand(0,3)],a=rand(1,den-2),b=rand(1,den-a);answer=(a+b)/den;label=frac(a+b,den);prompt=`${a}/${den} + ${b}/${den}`;explain=`Bagian berukuran sama: (${a} + ${b})/${den} = ${label}.`;topic='Pecahan';
 }else if(track==='d'){
  answer=rand(1,9);const a=rand(2,5),b=rand(1,10);prompt=`${a}x + ${b} = ${a*answer+b}`;explain=`Kurangi kedua ruas dengan ${b}, lalu bagi ${a}. Jadi x = ${answer}.`;topic='Cari nilai x';
 }else if(track==='e'){
  const a=rand(2,8),d=rand(2,6),n=rand(3,7);answer=a+(n-1)*d;prompt=`${a}, ${a+d}, ${a+2*d}, … U${n} = ?`;explain=`U${n} = ${a} + (${n} − 1) × ${d} = ${answer}.`;topic='Barisan aritmetika';
 }else{
  const a=rand(2,5),b=rand(1,5),x=rand(1,5);answer=a*(x+b);prompt=`f(x)=${a}x · g(x)=x+${b}. f(g(${x}))?`;explain=`g(${x}) = ${x+b}, lalu f(${x+b}) = ${a} × ${x+b} = ${answer}.`;topic='Komposisi fungsi';
 }
 label=label??String(answer);const options=[{label,value:answer}];
 for(let i=1;options.length<count;i++){
  let val=track==='c'?answer+(i%2?1:-1)*Math.ceil(i/2)/12:answer+(i%2?1:-1)*Math.ceil(i/2);
  if(val<0||options.some(o=>Math.abs(o.value-val)<1e-8))continue;
  const itemLabel=track==='c'?frac(Math.round(val*120),120):String(val);options.push({label:itemLabel,value:val});
 }
 return {prompt,answer,label,explain,topic,options:shuffle(options,rng)};
}
function memoryDeck(track,rng=Math.random){
 const pairs=[];let tries=0;
 while(pairs.length<4&&tries++<250){const q=arcadeQuestion(track,rng);if(!pairs.some(p=>Math.abs(p.answer-q.answer)<1e-8))pairs.push(q);}
 return shuffle(pairs.flatMap((q,i)=>[{id:`q${i}`,pair:i,label:q.prompt,kind:'question'},{id:`a${i}`,pair:i,label:track==='d'?`x = ${q.label}`:q.label,kind:'answer'}]),rng);
}
function exportProgress(s){return clone({...s,sessions:{}});}
