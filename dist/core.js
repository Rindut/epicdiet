// Product rules are shared by every page. Dates are journey-local YYYY-MM-DD.
export const FIELDS = ['nutrition', 'proteinG', 'movement', 'strength'];
export const blankEntry = date => ({ localDate:date, weightKg:null, nutrition:null, proteinG:null, movement:null, strength:null, note:'' });
export const initialState = () => ({ profile:null, entries:{}, targets:[], reflections:{}, decision:null, meta:{schemaVersion:1,lastExportAt:null,seenAchievementSignature:''} });
export const addDays = (date,n) => { const d=new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
export const weekStart = date => { const day=new Date(`${date}T12:00:00Z`).getUTCDay(); return addDays(date,-((day+6)%7)); };
export const weekEnd = date => addDays(weekStart(date),6);
export function todayIn(zone=Intl.DateTimeFormat().resolvedOptions().timeZone, now=new Date()) { const p=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now); return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-'); }
export function validDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T12:00:00Z`).getTime()) && new Date(`${s}T12:00:00Z`).toISOString().slice(0,10)===s; }
export function parseNumber(value) { if (value===null || value===undefined || String(value).trim()==='') return null; const s=String(value).trim().replace(',','.'); return /^\d+(\.\d+)?$/.test(s) && Number.isFinite(Number(s)) ? Number(s) : NaN; }
export const fmt = (v,d=1) => v===null || v===undefined ? '—' : Number(v).toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d});
export const pct = x => x===null ? '—' : `${Math.round(x*100)}%`;
export const formatDate = (date,opts={day:'numeric',month:'short',year:'numeric'}) => new Intl.DateTimeFormat('id-ID',{...opts,timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
export const period = ws => `${formatDate(ws,{day:'numeric',month:'short'})} – ${formatDate(addDays(ws,6))}`;
export function targetAt(state,date) { let result={proteinG:90,movementMinutes:30,strengthSessions:3}; for(const v of [...state.targets].sort((a,b)=>a.effectiveDate.localeCompare(b.effectiveDate))) if(v.effectiveDate<=date) for(const k of ['proteinG','movementMinutes','strengthSessions']) if(v[k]!=null) result[k]=v[k]; return result; }
export function scheduleTargets(state, values, today) {
  const next=structuredClone(state); const daily=addDays(today,1), weekly=addDays(weekStart(today),7);
  function upsert(date,patch){ let v=next.targets.find(x=>x.effectiveDate===date); if(!v){v={effectiveDate:date};next.targets.push(v);}Object.assign(v,patch); }
  upsert(daily,{proteinG:values.proteinG,movementMinutes:values.movementMinutes});
  upsert(weekly,{strengthSessions:values.strengthSessions});
  next.targets.sort((a,b)=>a.effectiveDate.localeCompare(b.effectiveDate)); return next;
}
export function validateEntry(raw,profile,today) {
  const errors={}, e=blankEntry(raw.localDate);
  if(!validDate(raw.localDate)||raw.localDate<profile.startDate||raw.localDate>today) errors.localDate='Pilih tanggal dari awal perjalanan sampai hari ini.';
  for(const key of ['weightKg','proteinG']) { const value=parseNumber(raw[key]); if(value!==null&&(!Number.isFinite(value)||(key==='weightKg'?value<=0:value<0))) errors[key]=key==='weightKg'?'Berat harus angka lebih dari 0.':'Protein harus angka 0 atau lebih.'; e[key]=value; }
  if(e.weightKg!==null&&Number.isFinite(e.weightKg)) e.weightKg=Math.round(e.weightKg*10)/10;
  if(e.weightKg!==null&&e.weightKg<=0) errors.weightKg='Berat harus minimal 0,1 kg.';
  for(const [k,allowed] of Object.entries({nutrition:['green','yellow','red'],movement:['achieved','not_yet'],strength:['done','not_today']})) {e[k]=raw[k]||null;if(e[k]!==null&&!allowed.includes(e[k])) errors[k]='Pilih salah satu jawaban yang tersedia.';}
  e.note=String(raw.note||'').trim(); if(e.note.length>500) errors.note='Catatan maksimal 500 karakter.';
  if(!errors.weightKg&&!errors.proteinG&&e.weightKg===null&&FIELDS.every(k=>e[k]===null)&&!e.note) errors.form='Isi minimal satu field. Catatan singkat juga boleh.';
  return {entry:e,errors};
}
export function validateProfile(raw,today) {
  const errors={}; for(const key of ['baselineKg','heightCm','proteinG','movementMinutes','strengthSessions']){const n=parseNumber(raw[key]);if(n===null||!Number.isFinite(n)||n<=0)errors[key]='Isi angka lebih dari 0.';raw[key]=n;}
  if(raw.baselineKg!==null&&Math.round(raw.baselineKg*10)/10<=75)errors.baselineKg='Berat awal perjalanan ini harus minimal 75,1 kg.';
  if(raw.strengthSessions!==null&&(!Number.isInteger(raw.strengthSessions)||raw.strengthSessions>7))errors.strengthSessions='Pilih 1–7 sesi per minggu.';
  if(!validDate(raw.startDate)||raw.startDate>today)errors.startDate='Pilih tanggal mulai paling lambat hari ini.';
  if(![60,65].includes(Number(raw.longTermGoalKg)))errors.longTermGoalKg='Pilih 60 atau 65 kg.';
  return errors;
}
export function mvd(entry,target) {
  const e=entry||{}; const actions=[];
  if(['green','yellow'].includes(e.nutrition))actions.push('Nutrisi');
  if(e.proteinG!=null&&e.proteinG>=target.proteinG)actions.push('Protein');
  if(e.movement==='achieved')actions.push('Gerak');
  if(e.strength==='done')actions.push('Latihan kekuatan');
  return {actions,state:actions.length?'achieved':FIELDS.every(k=>e[k]!=null)?'not_achieved':'unknown'};
}
export function weeks(state,today){if(!state.profile)return [];const out=[];for(let d=weekStart(state.profile.startDate);d<=weekStart(today);d=addDays(d,7))out.push(d);return out;}
export function weeklyBase(state,ws,today) {
  const end=addDays(ws,6);const dates=Array.from({length:7},(_,i)=>addDays(ws,i));const eligible=dates.filter(d=>d>=state.profile.startDate&&d<=today);
  const entries=eligible.map(d=>state.entries[d]).filter(Boolean);const weights=entries.filter(e=>Number.isFinite(e.weightKg)&&e.weightKg>0);
  // Store entered weight in decigrams to avoid floating point boundary surprises.
  const average=weights.length>=3?weights.reduce((s,e)=>s+Math.round(e.weightKg*10),0)/(weights.length*10):null;
  const coverage=Object.fromEntries(FIELDS.map(k=>[k,entries.filter(e=>e[k]!=null).length]));
  const green=entries.filter(e=>e.nutrition==='green').length,yellow=entries.filter(e=>e.nutrition==='yellow').length,red=entries.filter(e=>e.nutrition==='red').length;
  const protein=entries.filter(e=>e.proteinG!=null&&e.proteinG>=targetAt(state,e.localDate).proteinG).length;
  const movement=entries.filter(e=>e.movement==='achieved').length,strength=entries.filter(e=>e.strength==='done').length;
  const strengthTarget=targetAt(state,eligible[0]||ws).strengthSessions;
  const components={nutrition:coverage.nutrition?(green+yellow*.5)/coverage.nutrition:null,proteinG:coverage.proteinG?protein/coverage.proteinG:null,movement:coverage.movement?movement/coverage.movement:null,strength:Math.min(1,strength/strengthTarget)};
  const enough=FIELDS.every(k=>coverage[k]>=5);const score=enough?FIELDS.reduce((s,k)=>s+components[k],0)/4:null;
  const complete=end<today&&eligible.length===7&&FIELDS.every(k=>coverage[k]===7);
  const days=dates.map(date=>({date,eligible:eligible.includes(date),...mvd(state.entries[date],targetAt(state,date))}));
  return {start:ws,end,dates,eligible,entries,weights,average,coverage,green,yellow,red,protein,movement,strength,strengthTarget,components,score,complete,ongoing:end>=today,temporary:!complete,days,mvd:days.filter(d=>d.eligible&&d.state==='achieved').length,unknown:days.filter(d=>d.eligible&&d.state==='unknown').length};
}
export function weeklySummary(state,ws,today) {
  const w=weeklyBase(state,ws,today),prev=weeklyBase(state,addDays(ws,-7),today);
  w.delta=w.average!==null&&prev.average!==null?w.average-prev.average:null;
  w.firstWeek=ws===weekStart(state.profile.startDate);
  w.status=w.score===null?'Data kebiasaan belum cukup':w.score>=.6?'On Track':w.complete&&prev.complete&&w.score<.4&&prev.score<.4?'Perlu check-in':'Perlu perhatian';
  return w;
}
export function trend(state,ws,today) {
  const last=addDays(ws,6)<today?ws:addDays(ws,-7);
  const rows=[-14,-7,0].map(n=>weeklyBase(state,addDays(last,n),today));
  let pace=null,label='Belum cukup riwayat';
  if(rows.every(w=>w.average!==null)){pace=(rows[2].average-rows[0].average)/2;const p=Math.round(pace*1e9)/1e9;label=p>0?'Cenderung naik':p===0?'Relatif tetap':p>-.4?'Lebih lambat dari rencana':p>=-.6?'Sesuai rentang rencana':'Lebih cepat dari rencana';}
  return {pace,label,rows,start:rows[0].start,end:rows[2].end};
}
export function displayWeight(state,today) { const all=weeks(state,today).reverse();for(const ws of all){const w=weeklyBase(state,ws,today);if(w.average!==null)return w;}return null; }
export const milestonesFor = state => [78,75,72,70,67,65,62,60].filter(x=>x<state.profile.baselineKg);
export function achievements(state,today) {
  const result={};for(const ws of weeks(state,today)){if(addDays(ws,6)>=today)continue;const w=weeklyBase(state,ws,today);if(w.average===null)continue;
    for(const kg of milestonesFor(state)){if(w.average<=kg&&!result[kg])result[kg]={milestoneKg:kg,sourceWeek:ws,firstReachedAt:addDays(ws,7)};}
  } return result;
}
export const signature = a => JSON.stringify(Object.values(a).map(x=>[x.milestoneKg,x.sourceWeek]));
export function journey(state,today) {
  const achieved=achievements(state,today), source=displayWeight(state,today),average=source?.average??null,p=state.profile;
  const continued=state.decision?.optionalPhaseChoice==='continue'&&p.longTermGoalKg===60;
  const epics=[{n:1,from:p.baselineKg,to:75,targets:[78,75].filter(x=>x<p.baselineKg)},{n:2,from:75,to:70,targets:[72,70]},{n:3,from:70,to:65,targets:[67,65]},{n:4,from:65,to:60,targets:[62,60]}];
  for(const e of epics){ e.status=e.n===4&&p.longTermGoalKg===65?'not_selected':e.n===4&&!continued?'optional':achieved[e.to]?'completed':e.n===1||achieved[e.from]?'active':'locked'; if(e.n===4&&continued&&!achieved[65])e.status='locked'; }
  const active=epics.find(e=>e.status==='active')||null, next=active?.targets.find(x=>!achieved[x])??null;
  const progress=active&&average!==null?Math.max(0,Math.min(1,(active.from-average)/(active.from-active.to))):null;
  const overall=average===null?null:Math.max(0,Math.min(1,(p.baselineKg-average)/(p.baselineKg-p.longTermGoalKg)));
  const finished=!!achieved[p.longTermGoalKg]&&(p.longTermGoalKg===65||continued);
  return {achieved,source,average,epics,active,next,progress,overall,finished,remaining:active&&average!==null?Math.max(0,average-active.to):null,awaitingChoice:!!achieved[65]&&p.longTermGoalKg===60&&!continued};
}
export function duration(kg){return `${Math.ceil(Math.max(0,kg)/.6)}–${Math.ceil(Math.max(0,kg)/.4)} minggu`;}
export function csvCell(value,isText=false) { if(value===null||value===undefined)return '""';let s=String(value);if(isText&&/^[\s\u0000-\u001f]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'; }
export function exportCsv(state) {
  const headers=['recordType','localDate','weightKg','nutrition','proteinG','movement','strength','note','effectiveDate','movementMinutes','strengthSessions','startDate','baselineKg','heightCm','timeZone','longTermGoalKg','weekStart','reflection','decisionDate','optionalPhaseChoice','schemaVersion'];
  const rows=[{recordType:'profile',...state.profile},{recordType:'meta',schemaVersion:state.meta.schemaVersion},...Object.values(state.entries).sort((a,b)=>a.localDate.localeCompare(b.localDate)).map(e=>({recordType:'daily',...e})),...state.targets.map(t=>({recordType:'target',...t})),...Object.entries(state.reflections).map(([weekStart,r])=>({recordType:'reflection',weekStart,reflection:r.text})),...(state.decision?[{recordType:'decision',...state.decision}]:[])];
  return '\ufeff'+headers.join(',')+'\r\n'+rows.map(row=>headers.map(h=>csvCell(row[h],['note','reflection'].includes(h))).join(',')).join('\r\n');
}
