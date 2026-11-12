'use strict';
const bands=[[1266,1109,972,849],[1610,1404,1230,1076],[1941,1698,1487,1297],[2315,1968,1674,1422],[2651,2184,1802,1490],[3764,2823,2117,1585],[5364,3753,2627,1840]];
const limits=[117000,141000,167000,188000,244000,347000,Infinity];
const vehicle={light:'פרטי או מסחרי עד 3,500 ק״ג',heavy:'מסחרי מעל 3,500 ק״ג, רכב עבודה או רכב ייעודי לפי פרט 3',bike:'אופנוע, תלת אופנוע או אופנוע עם רכב צדי',bus:'אוטובוס או טיולית',taxi:'מונית או רכב סיור ברישיון',tractor:'טרקטור',trailer:'גרור להובלת טובין',semi:'נתמך',classic:'רכב הרשום כאספנות',special:'סיווג אחר או לא ידוע'};
const periodStart='2026-04-01',periodEnd='2027-03-31';
function estimate(v){
 const fail=reason=>({reason}); const lines=[];
 if(!v.date||v.date<periodStart||v.date>periodEnd)return fail('מועד החיוב מחוץ לתקופת מחירון אפריל 2026.');
 if([v.reserve,v.safety,v.ffv].includes('unknown'))return fail('יש לאמת את ההפחתה האפשרית לפני קביעת סכום.');
 if(v.case!=='normal')return fail('במצב זה נדרש בירור ברשות הרישוי לפני קביעת הסכום: פטור, החזר, חוב, הפקדה, גניבה, פירוק, חסימת חידוש או שינוי סיווג.');
 if(!Object.hasOwn(vehicle,v.type)||v.type==='special')return fail('יש לברר את סיווג הרכב ואת התעריף מול רשות הרישוי.');
 const m=Number(v.months);if(!Number.isInteger(m)||m<1||(m>12&&!(m===24&&v.type==='tractor')))return fail('יש לבחור תקופה שמתאימה לרכב.');
 const scheme=v.elig; if(!['standard','disabled','institution','defense'].includes(scheme))return fail('יש לאמת את הזכאות לתעריף המופחת.');
 if(!['none','resolved','known'].includes(v.prior))return fail('יש לברר אם נותר הפרש אגרה מהבעלות הקודמת.');
 if(scheme!=='standard'&&m!==12)return fail('לתעריף מופחת בתקופה שאינה שנה נדרש בירור מול רשות הרישוי.');
 let base, basis;
 if(scheme!=='standard'){base=30;basis='אגרה מופחתת שנתית לפי אישור רשות הרישוי';}
 else switch(v.type){
 case 'light':{
 const y=Number(v.year); if(!Number.isInteger(y)||y<1900||y>Number(v.date.slice(0,4))||y>2026)return fail('יש לבחור שנת סיווג תקינה לפי הרישיון.');
 let g=Number(v.group); if(v.group==='price'){const p=Number(v.price);if(y!==2026||!(p>0))return fail('אפשר להסיק קבוצה ממחיר רק לדגם שנרשם לראשונה ב־2026 ובמחיר הרשמי שלו.');g=limits.findIndex(n=>p<=n)+1;}
 if(!Number.isInteger(g)||g<1||g>7)return fail('יש לבחור קבוצת מחיר לפי הרישיון.');
 const b=y>=2024?0:y>=2021?1:y>=2017?2:3;base=bands[g-1][b];basis='קבוצת מחיר '+g+' · שנת סיווג '+y;break;}
 case 'bike':base=({small:52,mid:194,large:357,electric:52})[v.cc];basis='סיווג מנוע האופנוע';break;
 case 'heavy':base=v.engine==='other'?452:v.engine==='diesel'?({low:2292,mid:2877,high:3964})[v.weight]:undefined;basis='סוג מנוע ומשקל כולל מותר';break;
 case 'bus':base=v.engine==='diesel'?1214:v.engine==='other'?656:undefined;basis='סוג מנוע האוטובוס';break;
 case 'taxi':base=({diesel:[770,1256],other:[164,223]})[v.engine]?.[v.seats==='low'?0:v.seats==='high'?1:2];basis='מנוע ומספר מושבי נוסעים ללא נהג';break;
 case 'tractor':base=v.engine==='petrol'?(m===24?549:274):v.engine==='other'?(m===24?1604:803):undefined;basis='מנוע ותקופת רישיון לטרקטור';break;
 case 'trailer':base=({low:80,mid:194,high:440})[v.weight];basis='משקל כולל מותר של הגרור';break;
 case 'semi':base=440;basis='אגרה שנתית לנתמך';break;
 case 'classic':base=265;basis='אגרה שנתית לרכב הרשום כאספנות';break;
 }
 if(!Number.isFinite(base))return fail('יש להשלים את מאפייני הרכב הנדרשים.');
 lines.push([basis,base]);
 let subtotal=base;
 if(m<12){subtotal=base*m/12;lines.push(['התאמה ל־'+m+' חודשי חיוב (כל חודש מלא או חלק ממנו)',subtotal-base]);}
 const reductions=[];
 if(scheme==='standard'&&v.type==='light'){
 if(v.use==='training')reductions.push(['רכב הרשום להוראת נהיגה',285]);
 if(v.safety==='700'||v.safety==='100')reductions.push(['שלב הטבת מערכות בטיחות שאושר',Number(v.safety)]);
 if(v.ffv==='1664'||v.ffv==='832')reductions.push(['הפחתה לרכב גמיש תדלוק לפי מועד הוראת רישום',Number(v.ffv)]);
 }
 const reserve=({r1:70,r15:141,r2:211})[v.reserve];
 if(reserve){if(!['light','bike'].includes(v.type)&&scheme!=='disabled')return fail('הטבת מילואים דורשת רכב מזכה לפי הודעת משרד התחבורה.');reductions.push(['זכאות מילואים שאושרה לרכב זה',reserve]);}
 if(reductions.length&&(m!==12||reductions.length>1))return fail('שילוב הפחתות או הפחתה בתקופה חלקית מחייב אימות של החיוב ברשות הרישוי.');
 const excluded=['bike','trailer','semi'].includes(v.type);
 let broadcast=excluded?0:135;
 if(!excluded&&(scheme!=='standard'||m!==12||v.type==='classic')){
  if(v.broadcast==='known'&&v.broadcastAmount!==''&&Number.isFinite(Number(v.broadcastAmount))&&Number(v.broadcastAmount)>=0)broadcast=Number(v.broadcastAmount);else if(v.broadcast==='no')broadcast=0;else return fail('יש לאמת בשובר האם תוספת תאגיד השידור חלה במקרה זה.');
 }
 for(const [label,n] of reductions){const floor=13;const applied=Math.min(n,Math.max(0,subtotal-floor));subtotal-=applied;lines.push([label+' (לאחר תקרת ההפחתה)',-applied]);}
 if(broadcast)lines.push(['תוספת תאגיד השידור',broadcast]);
 if(v.channel==='clerk')lines.push(['חידוש באמצעות פקיד רשות הרישוי',32]);
 let total=lines.reduce((t,l)=>t+l[1],0);total=Math.round((total+Number.EPSILON)*100)/100;
 let extra=0;if(v.prior==='known'){extra=Number(v.difference);if(v.difference===''||!Number.isFinite(extra)||extra<0)return fail('יש להזין הפרש תקף מהשובר הרשמי.');}
 return {total,extra,lines};
}
if(typeof module!=='undefined')module.exports={estimate,bands};
