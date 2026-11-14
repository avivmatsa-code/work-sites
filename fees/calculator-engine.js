'use strict';
// Published 2026 rates; each calculation returns its unrounded breakdown.
const FeeEngine=(()=>{
const sources={driver:'https://www.gov.il/he/pages/car_fees_2026',garage:'./#fee/7-42',vessel:'https://olaw.org.il/takanot/takanot-12227.pdf',aircraft:'https://olaw.org.il/takanot/takanot-12218.pdf'};
function calculate(domain,v){
 const lines=[],notes=[];const add=(label,value)=>lines.push({label,value});
 const number=(key,min=0,integer=false)=>{const n=Number(v[key]);if(v[key]==null||v[key]===''||!Number.isFinite(n)||n<min||(integer&&!Number.isInteger(n)))throw Error('יש להשלים ערך תקין: '+key);return n;};
 const choice=(key,allowed)=>{if(!allowed.includes(v[key]))throw Error('יש לבחור אפשרות: '+key);return v[key];};
 const yes=key=>choice(key,['yes','no'])==='yes';
 const band=(n,limits,rates)=>rates[limits.findIndex(x=>n<=x)];
 try{
 const start=['driver','garage'].includes(domain)?'2026-04-01':'2026-01-01';
 if(!/^2026-\d{2}-\d{2}$/.test(v.date||'')||!Number.isFinite(Date.parse(v.date))||new Date(v.date).toISOString().slice(0,10)!==v.date||v.date<start||v.date>'2026-12-31')throw Error('מועד החיוב חייב להיות בתקופת המחירון המוצגת לשנת 2026.');
 if(domain==='garage'){
  choice('service',['license','manager','theory','practical','copy']);
  if(v.service==='license'){const n=number('types',1,true);add('בסיס — סוג מוסך אחד',451);add((n-1)+' סוגי מוסך נוספים × 197 ₪',(n-1)*197);if(yes('expert'))add('תוספת מוסך מומחה',347);}
  else add({manager:'רישיון לניהול מקצועי',theory:'בחינה עיונית',practical:'בחינה מעשית',copy:'העתק רישיון'}[v.service],{manager:220,theory:158,practical:268,copy:23}[v.service]);
  notes.push('תעריפי 2026 מקובץ המיפוי, מעוגלים לשקל. החישוב לרישיון הוא לשנה מלאה; תקופה אחרת מחייבת בירור.');
 }else if(domain==='driver'){
  choice('service',['renew','copy','theory','practical','control']);
  if(['theory','practical','control'].includes(v.service))add('אגרת בחינה',({theory:57,practical:165,control:80})[v.service]);
  else{
   const scheme=choice('scheme',['standard','reserve','exempt','professional']);
   if(scheme==='reserve')add('מילואים פעיל — זכאות מאושרת',14);
   else if(scheme==='exempt')add('טיפול בהנפקה למי שאושר לו פטור',26);
   else{
    if(v.service==='copy'&&scheme==='professional')throw Error('קיזוז דרגה מקצועית חל בהנפקת הרישיון, ולא בחישוב כפל.');
    const term=v.service==='copy'?'copy':choice('term',['years','long']);
    if(term==='copy')add('כפל רישיון',23);
    else
    if(term==='long')add('מעל עשר שנים עד מועד הבדיקות הרפואיות המאושר',602);
    else{const y=number('years',1,true),m=number('months',0,true),a=[0,61,110,165,218,269,317,365,413,471,517];if(y>10||m>11||(y===10&&m))throw Error('יש לבחור 1–10 שנים; מעל עשר שנים יש לבחור במסלול המתאים.');add(y+' שנים מלאות',a[y]);if(m)add(m+' חודשי חיוב נוספים לפי הפרש מדרגות',m*(a[y+1]-a[y])/12);}
    if(scheme==='professional'){if(term==='long')throw Error('מסלול קיזוז לדרגה מקצועית מחייב תקופה של עד עשר שנים.');const credit=number('credit');const current=lines.reduce((a,b)=>a+b.value,0);add('קיזוז שאושר, בכפוף למינימום 12 ₪',-Math.min(credit,Math.max(0,current-12)));notes.push('סכום הזיכוי מוזן לפי חישוב מאושר של רשות הרישוי.');}
    if(yes('clerk')&&!yes('clerkExempt'))add('הנפקה חוזרת באמצעות פקיד',32);
   }
  }
  notes.push('תקופת הרישיון והזכאות הן לפי האישור/ספח. גיל ודרגה אינם משמשים כאן לקביעת תוקף אוטומטית.');
 }else if(domain==='vessel'){
  const service=choice('service',['general','repeat','permit','special','license','measurement','remeasure']);
  if(service==='license')add('רישיון שיט או חידושו — תעודה בלבד',224);
  else if(['measurement','remeasure'].includes(service)){const ton=number('tonnage');let b=band(ton,[99,499,Infinity],[224,774,4720]);add('מדידת תפוסה'+(service==='remeasure'?' חוזרת — מחצית':''),b*(service==='remeasure'?.5:1));notes.push('תעריף מדידה לפי קובץ המיפוי; נפרד מהודעת בטיחות השיט.');}
  else if(service==='special'){add('אגרת נושא הבדיקה כפי שאומתה',number('subjectFee'));add('תוספת בדיקה מיוחדת — 50%',number('subjectFee')*.5);}
  else{
   const kind=choice('kind',['boat','tug','barge','ship']);
   if(service==='repeat'&&kind!=='tug'){if(kind==='ship')throw Error('לבדיקה חוזרת באונייה יש לבחור נושא בדיקה; החישוב הכללי אינו חל.');add('בדיקה חוזרת של סירה, ספינה או ארבה',223);}
   else{
    if(kind==='boat'){const kw=number('kw'),people=number('people',1,true),length=number('length',.01);add('בסיס בדיקה כללית',305);add('הספק מעל 4 קילווט × 5 ₪',Math.max(0,kw-4)*5);add('אנשים מורשים מעבר לשניים × 5 ₪',Math.max(0,people-2)*5);add('מטר או חלק ממנו מעל 7 מטר × 14 ₪',Math.ceil(Math.max(0,length-7))*14);}
    if(kind==='tug'){add('בסיס בדיקת גוררת',601);add('הספק מנוע בקילווט × 5 ₪',number('kw')*5);}
    if(kind==='barge'){add('בסיס בדיקת ארבה',305);add('כל מטר או חלק ממנו × 14 ₪',Math.ceil(number('length',.01))*14);if(yes('dump'))add('ארבה שומטת',70);if(yes('dredger'))add('חפרת',70);}
    if(kind==='ship')add('בדיקה כללית לפי תפוסה ברוטו',band(number('tonnage'),[499,1599,Infinity],[1493,2942,9309]));
    const base=lines.reduce((s,l)=>s+l.value,0);
    if(service==='repeat')add('התאמה לבדיקה חוזרת של גוררת — מחצית',-base*.5);
    if(service==='permit')add('היתר שיט כולל בדיקת כושר — תוספת 50%',base*.5);
   }
  }
 }else if(domain==='aircraft'){
  const service=choice('service',['registration','dealer','airworthiness','special','specialChange','type','production','uav','exportAircraft','exportPart','typeChange','productionChange','uavChange','simulator']);
  let base=0,hours=false,free=2,cap=Infinity;
  const weightServices=['registration','dealer','airworthiness','special','uav','exportAircraft'];let w=weightServices.includes(service)?number('weight',.001):0;
  if(service==='registration')base=band(w,[25,150,700,2000,5700,45000,Infinity],[250,390,510,640,770,2320,5020]);
  if(service==='dealer'){base=band(w,[150,700,2000,Infinity],[4050,6440,57810,83820]);if(yes('paid'))base=0;notes.push('יש להזין את המשקל המרבי מבין הקטגוריות המבוקשות; התשלום פעם אחת בשנה.');}
  if(service==='airworthiness')base=band(w,[700,2000,5700,20000,45000,100000,300000,Infinity],[640,1420,2960,19310,34710,48590,97180,222120]);
  if(service==='special'){
   const category=choice('category',['weight','agriculture','commuter']);base=category==='agriculture'?1420:category==='commuter'?1930:band(w,[700,2000,5700,20000,45000,100000,300000,Infinity],[640,1420,1930,6440,11110,27760,34710,69410]);
   if(yes('experimentOnly'))base*=.5;
   hours=yes('experimental')&&w<=20000;if(hours&&yes('amateur')&&w<=700)cap=10;
  }
  if(service==='specialChange'){base=2140;hours=true;}
  if(service==='type'){base=yes('glider')?1285:2570;hours=true;}
  if(service==='production'){base=2570;hours=true;if(yes('foreignFacility'))base*=1.5;}
  if(service==='uav'){base=band(w,[25,150,2000,Infinity],[510,2320,10570,24170]);if(yes('paid'))base=0;hours=yes('experimental');notes.push('בסיס פעם אחת בשנה לאותו טיפוס; שעות מעבר לשעתיים בכל בקשה.');}
  if(service==='exportAircraft')base=band(w,[150,700,2000,5700,45000,Infinity],[510,640,1420,1930,14290,28580]);
  if(service==='exportPart'){const mode=choice('exportMode',['single','series','aog']);base=mode==='series'?13980:mode==='aog'?1930*.25:1930;hours=mode==='single';if(mode==='aog'){if(number('hours')>2)throw Error('מסלול AOG מחייב בדיקה משוערת עד שעתיים ואישור המנהל.');add('הוצאות נסיעה ואש״ל מאושרות',number('expenses'));}}
  if(['typeChange','productionChange','uavChange'].includes(service)){hours=true;free=0;}
  if(service==='simulator'){base=830;hours=true;}
  add('תעריף בסיס / מדרגה / חלופה נבחרת',base);
  if(hours){const h=number('hours');add('שעות לחיוב אחרי שעות כלולות ותקרה × 420 ₪',Math.min(cap,Math.max(0,h-free))*420);}
  if(yes('abroad')){add('שעות שירות בחו״ל לפי תקנה 37 × 420 ₪',number('abroadHours')*420);add('שעות טיסה — עד 24 × 420 ₪',Math.min(24,number('flightHours'))*420);add('הוצאות חו״ל מאושרות',number('abroadExpenses'));notes.push('שעות תקנה 37 מוזנות בנפרד משעות השירות; יש לוודא את שיוך השעות וההוצאות בדרישת הרשות.');}
  notes.push('לשירות רב־שנתי החישוב מתייחס לחיוב שנתי/בקשה אחת בלבד.');
 }else throw Error('מחשבון לא מוכר');
 const raw=lines.reduce((s,l)=>s+l.value,0);if(!Number.isFinite(raw)||raw<0)throw Error('הנתונים אינם מאפשרים חישוב תקין.');
 return {total:Math.round(raw),raw,lines,notes,source:sources[domain]};
 }catch(e){return {reason:e.message};}
}
return {calculate,sources};
})();
if(typeof module!=='undefined')module.exports=FeeEngine;
