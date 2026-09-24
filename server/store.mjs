import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';

// The local adapter is single-process only. Production must use shared Redis.
export function createLocalStore(file=resolve('.local/server-data.json')) {
  let queue=Promise.resolve();
  function transaction(fn){const result=queue.then(async()=>{let data={};try{data=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}for(const [key,v] of Object.entries(data))if(v.expires&&v.expires<=Date.now())delete data[key];const out=fn(data);await mkdir(dirname(file),{recursive:true,mode:0o700});await writeFile(file+'.tmp',JSON.stringify(data),{mode:0o600});await rename(file+'.tmp',file);return out;});queue=result.catch(()=>{});return result;}
  return {
    get:key=>transaction(d=>d[key]?.value??null),
    set:(key,value,ttl)=>transaction(d=>{d[key]={value,expires:ttl?Date.now()+ttl*1000:null};}),
    del:key=>transaction(d=>{delete d[key];}),
    limit:(key,seconds)=>transaction(d=>{const old=d[key];const count=(Number(old?.value)||0)+1;d[key]={value:count,expires:old?.expires||Date.now()+seconds*1000};return count;}),
    cas:(key,revision,value)=>transaction(d=>{const current=d[key]?.value;const old=current?JSON.parse(current):null;if((old?.meta?.revision||0)!==revision)return false;d[key]={value,expires:null};return true;})
  };
}
// Accepts Upstash's own names or the KV_* names the Vercel Marketplace integration generates.
export function createRedisStore(env=process.env){
  const url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;
  if(!url?.startsWith('https://')||!token)throw Error('Storage unavailable');
  async function command(args){const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Storage unavailable');const body=await response.json();if(body.error)throw Error('Storage unavailable');return body.result;}
  return {
    get:key=>command(['GET',key]),set:(key,value,ttl)=>command(['SET',key,value,...(ttl?['EX',ttl]:[])]),del:key=>command(['DEL',key]),
    limit:(key,seconds)=>command(['EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",1,key,seconds]),
    cas:async(key,revision,value)=>(await command(['EVAL',"local raw=redis.call('GET',KEYS[1]); local rev=0; if raw then local v=cjson.decode(raw); rev=v.meta.revision or 0 end; if rev~=tonumber(ARGV[1]) then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); return 1",1,key,revision,value]))===1
  };
}
let shared;
export function getStore(){if(!shared){if(process.env.EPIC_STORAGE==='local'&&!process.env.VERCEL)shared=createLocalStore();else shared=createRedisStore();}return shared;}
