'use strict';
const form=document.querySelector('#form'),result=document.querySelector('#result'),f=form.elements;
const choices=(name,list,placeholder=false)=>{const x=f[name],old=x.value;x.replaceChildren(...(placeholder?[['','בחרו…'],...list]:list).map(([v,t])=>new Option(t,v)));if([...x.options].some(o=>o.value===old))x.value=old;};
const pairs=o=>Object.entries(o);
choices('type',pairs(vehicle),true);
choices('year',Array.from({length:11},(_,i)=>[2026-i,i===10?'2016 ומטה':2026-i]),true);
choices('group',[...Array.from({length:7},(_,i)=>[i+1,'קבוצה '+(i+1)]),['price','חישוב לפי מחיר רשמי לדגם שנרשם ב־2026']],true);
choices('cc',pairs({small:'עד 50 סמ״ק',mid:'51–150 סמ״ק',large:'151 סמ״ק ומעלה',electric:'חשמלי'}),true);
choices('seats',pairs({low:'עד 4 מושבי נוסעים',high:'5 מושבים ומעלה'}),true);
choices('case',pairs({normal:'חידוש או רישוי רגיל, ללא חריג ידוע',exception:'יש חריג: פטור, הפקדה, חוב, חסימה או שינוי סיווג',unknown:'לא ידוע אם יש חריג'}),true);
choices('elig',pairs({standard:'ללא אגרה מופחתת מיוחדת',disabled:'אגרה מופחתת שאושרה לרכב של אדם עם מוגבלות',institution:'תעריף מופחת שאושר למוסד או לאגודה',defense:'תעריף מופחת שאושר לרכב רפואי של משרד הביטחון',unknown:'הזכאות טרם אומתה'}),true);
choices('prior',pairs({none:'אין הפרש ידוע לאחר בדיקה',resolved:'הפרש קודם שולם או נסגר',known:'יש הפרש בשובר רשמי',unknown:'הפרש אפשרי או לא ידוע'}),true);
choices('reserve',pairs({none:'אין זכאות מאושרת',r1:'מילואים פעיל ללא תגמול נוסף או נקודה אחת',r15:'נקודה וחצי',r2:'שתי נקודות',unknown:'לא ידוע'}));
choices('use',pairs({standard:'לא',training:'כן — רשום להוראת נהיגה'}));
choices('safety',[['none','אין הפחתה מאושרת'],['700','שלב ראשון או שני — ₪700'],['100','שלב שלישי — ₪100'],['unknown','לא ידוע אם אושרה']]);
choices('ffv',[['none','לא חל תעריף FFV מופחת'],['1664','בתוך שנתיים — ₪1,664'],['832','בין שנתיים לארבע — ₪832'],['unknown','לא ידוע אם חלה הפחתה']]);
choices('broadcast',pairs({unknown:'טרם אומת',known:'סכום התוספת מופיע בשובר',no:'התוספת אינה חלה לפי השובר'}));
choices('channel',pairs({online:'ללא הפקה אצל פקיד רשות הרישוי',clerk:'חידוש אצל פקיד רשות הרישוי'}));
const show=(name,on)=>{const l=form.querySelector('[data-field="'+name+'"]');l.hidden=!on;f[name].disabled=!on;};
function update(){
 const t=f.type.value, normal=f.elig.value==='standard', light=t==='light'&&normal;
 const engineOptions=t==='tractor'?[['petrol','בנזין'],['other','דיזל או אחר']]:[['diesel','דיזל'],['other','שאינו דיזל']];
 choices('engine',engineOptions,true);
 choices('weight',(t==='trailer'?['עד 4,000','4,001–8,000','8,001 ומעלה']:['עד 16,000','16,001–20,000','20,001 ומעלה']).map((x,i)=>[['low','mid','high'][i],x+' ק״ג']),true);
 if(f.months.options.length===0)choices('months',[[12,'שנה'],...Array.from({length:11},(_,i)=>[i+1,(i+1)+' חודשי חיוב'])]);
 const opt=[...f.months.options].find(o=>o.value==='24');if(t==='tractor'&&!opt)f.months.add(new Option('שנתיים',24));if(t!=='tractor'&&opt){if(opt.selected)f.months.value='12';opt.remove();}
 show('year',light);show('group',light);show('price',light&&f.group.value==='price');
 show('cc',normal&&t==='bike');show('engine',normal&&['heavy','bus','taxi','tractor'].includes(t));show('weight',normal&&(t==='trailer'||(t==='heavy'&&f.engine.value==='diesel')));show('seats',normal&&t==='taxi');
 show('use',light);show('safety',light);show('ffv',light);show('reserve',(normal&&['light','bike'].includes(t))||f.elig.value==='disabled');
 show('difference',f.prior.value==='known');
 show('broadcast',!!t&&!['bike','trailer','semi','special'].includes(t)&&(!normal||Number(f.months.value)!==12||t==='classic'));
 show('broadcastAmount',!f.broadcast.disabled&&f.broadcast.value==='known');
 result.hidden=true;
}
function init(){f.date.value=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());update();}
form.addEventListener('change',update);
form.addEventListener('input',()=>{result.hidden=true;});
form.addEventListener('reset',()=>setTimeout(init,0));
const fmt=n=>new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',maximumFractionDigits:2,minimumFractionDigits:0}).format(n);
form.addEventListener('submit',e=>{
 e.preventDefault();const v=Object.fromEntries(new FormData(form));const r=estimate(v);result.hidden=false;result.className='card '+(r.reason?'warn':'result');
 if(r.reason){result.innerHTML='<h2>נדרש בירור לפני קביעת סכום</h2><p></p><a href="https://www.gov.il/he/service/car_licence_renewal">לשירות חידוש רישיון רכב</a>';result.querySelector('p').textContent=r.reason;}
 else {result.innerHTML='<h2>אומדן אגרת רישוי</h2><div class="total">'+fmt(r.total)+'</div><table><thead><tr><th>רכיב החישוב</th><th>סכום</th></tr></thead><tbody></tbody></table>'+ (r.extra?'<p><b>הפרש לפי שובר שהוזן:</b> '+fmt(r.extra)+' · <b>סה״כ משוער:</b> '+fmt(r.total+r.extra)+'</p>':'')+'<p>הסכום לתשלום נקבע במערכת רשות הרישוי. דמי טסט והעברת בעלות אינם כלולים.</p><button class="print secondary" type="button">הדפסה</button>';
 for(const [label,n] of r.lines){const tr=result.querySelector('tbody').insertRow();tr.insertCell().textContent=label;tr.insertCell().textContent=fmt(n);}result.querySelector('button').onclick=()=>window.print();}
 result.focus();
});
init();
