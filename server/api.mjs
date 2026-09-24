import {getStore} from './store.mjs';
import {checkPassword,digest,token} from './account.mjs';
import {initialState,validateProfile,validateEntry,validDate,todayIn} from '../dist/core.js';
const SESSION_SECONDS=7*24*60*60,MAX_BODY=2*1024*1024;
const fail=(status,message)=>Object.assign(new Error(message),{status});
function validateState(value){
  if(!value||typeof value!=='object'||!value.profile||value.meta?.schemaVersion!==1||!Number.isSafeInteger(value.meta.revision??0)||(value.meta.revision??0)<0)throw fail(400,'Data tidak valid.');
  const p=value.profile;let date;try{date=todayIn(p.timeZone);}catch{throw fail(400,'Zona waktu tidak valid.');}
  const defaults={...p,proteinG:90,movementMinutes:30,strengthSessions:3};if(Object.keys(validateProfile(defaults,date)).length)throw fail(400,'Profil tidak valid.');
  for(const name of ['entries','reflections'])if(!value[name]||typeof value[name]!=='object'||Array.isArray(value[name]))throw fail(400,'Data tidak valid.');
  if(!Array.isArray(value.targets)||!value.targets.length||value.targets.length>10000)throw fail(400,'Target tidak valid.');
  for(const [day,e] of Object.entries(value.entries)){if(day!==e?.localDate||Object.keys(validateEntry(e,p,date).errors).length)throw fail(400,'Catatan tidak valid.');}
  for(const t of value.targets){if(!validDate(t.effectiveDate))throw fail(400,'Target tidak valid.');for(const key of ['proteinG','movementMinutes','strengthSessions'])if(t[key]!=null&&(!Number.isFinite(t[key])||t[key]<=0||(key==='strengthSessions'&&(!Number.isInteger(t[key])||t[key]>7))))throw fail(400,'Target tidak valid.');}
  for(const [day,r] of Object.entries(value.reflections))if(!validDate(day)||typeof r?.text!=='string'||r.text.length>10000)throw fail(400,'Refleksi tidak valid.');
}
async function jsonBody(req){if(!String(req.headers['content-type']||'').startsWith('application/json'))throw fail(415,'Gunakan JSON.');if(req.body!==undefined){const data=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(data))>MAX_BODY)throw fail(413,'Data terlalu besar.');return data;}let raw='',size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw fail(413,'Data terlalu besar.');raw+=chunk.toString();}try{return JSON.parse(raw);}catch{throw fail(400,'Data tidak valid.');}}
export function createHandler({env=process.env,store:provided}={}){return async(req,res)=>{
  res.setHeader('Cache-Control','no-store, private');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body));};
  try{
    if(!env.EPIC_USERNAME||!env.EPIC_PASSWORD_HASH||!env.EPIC_ORIGIN)throw fail(503,'Akun belum dikonfigurasi di server.');
    const origin=new URL(env.EPIC_ORIGIN).origin,secure=origin.startsWith('https://');
    if(env.VERCEL&&(!secure||env.EPIC_STORAGE==='local'))throw fail(503,'Penyimpanan akun belum siap.');
    const path=new URL(req.url,origin).pathname;
    if(!['GET','POST','PUT','DELETE'].includes(req.method))throw fail(405,'Metode tidak tersedia.');
    if(req.method!=='GET'&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site'))throw fail(403,'Permintaan ditolak.');
    const store=provided||getStore(),prefix='epic:v1:'+digest(env.EPIC_USERNAME)+':',accountVersion=digest(env.EPIC_PASSWORD_HASH);
    const cookieName=secure?'__Host-epic-session':'epic-session';
    const cookie=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
    const sessionKey=cookie&&/^[a-f0-9]{64}$/.test(cookie)?prefix+'session:'+digest(cookie):null;
    const setCookie=(value,maxAge)=>res.setHeader('Set-Cookie',`${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure?'; Secure':''}`);
    if(path==='/api/login'&&req.method==='POST'){
      // Account-wide rate limit works across Vercel instances and IP changes.
      if(await store.limit(prefix+'login-attempts',900)>20)throw fail(429,'Terlalu banyak percobaan. Coba lagi dalam 15 menit.');
      const data=await jsonBody(req);if(typeof data.username!=='string'||typeof data.password!=='string'||data.username.length>100||data.password.length>256)throw fail(400,'Username atau password tidak valid.');
      const valid=await checkPassword(data.password,env.EPIC_PASSWORD_HASH);
      if(!valid||data.username!==env.EPIC_USERNAME)throw fail(401,'Username atau password salah.');
      if(sessionKey)await store.del(sessionKey);
      const fresh=token();await store.set(prefix+'session:'+digest(fresh),accountVersion,SESSION_SECONDS);setCookie(fresh,SESSION_SECONDS);
      return send(200,{username:env.EPIC_USERNAME});
    }
    if(!sessionKey||await store.get(sessionKey)!==accountVersion)throw fail(401,'Sesi berakhir. Masuk kembali.');
    if(path==='/api/session'&&req.method==='GET')return send(200,{username:env.EPIC_USERNAME,storage:env.EPIC_STORAGE==='local'?'local':'cloud'});
    if(path==='/api/logout'&&req.method==='POST'){await store.del(sessionKey);setCookie('',0);return send(200,{ok:true});}
    if(path==='/api/state'){
      const key=prefix+'state';
      if(req.method==='GET'){const raw=await store.get(key);return send(200,raw?JSON.parse(raw):initialState());}
      if(req.method==='PUT'||req.method==='DELETE'){
        const body=await jsonBody(req),revision=body?.meta?.revision??body?.revision??0;
        if(!Number.isSafeInteger(revision)||revision<0)throw fail(400,'Versi data tidak valid.');
        if(req.method==='PUT')validateState(body);
        const next=req.method==='DELETE'?initialState():body;
        next.meta={...next.meta,revision:revision+1};
        if(!await store.cas(key,revision,JSON.stringify(next)))throw fail(409,'Catatan berubah di perangkat lain. Muat ulang sebelum menyimpan; salin dulu isian yang belum tersimpan.');
        return send(200,next);
      }
    }
    throw fail(404,'Tidak ditemukan.');
  }catch(e){send(e.status||503,{error:e.status?e.message:'Server belum tersedia. Coba lagi nanti.'});}
};}
export default createHandler();
