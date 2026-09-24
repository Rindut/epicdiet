import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHandler} from '../server/api.mjs';
import {createLocalStore} from '../server/store.mjs';
import {hashPassword} from '../server/account.mjs';
import {initialState,todayIn} from '../dist/core.js';
const password='Test-only-password-not-for-deployment';
async function setup(t){
  const dir=await mkdtemp(join(tmpdir(),'epic-account-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const env={EPIC_USERNAME:'testuser',EPIC_PASSWORD_HASH:await hashPassword(password),EPIC_ORIGIN:'http://localhost:3040',EPIC_STORAGE:'local'};
  const store=createLocalStore(join(dir,'store.json')),handler=createHandler({env,store});
  async function call(path,method='GET',body, cookie='',origin=env.EPIC_ORIGIN){
    const headers={};let result;
    const req={url:path,method,body,headers:{origin,cookie,'content-type':'application/json'}};
    const res={statusCode:200,setHeader:(k,v)=>headers[k.toLowerCase()]=v,end:v=>result=JSON.parse(v)};
    await handler(req,res);return {status:res.statusCode,body:result,headers,cookie:headers['set-cookie']?.split(';')[0]};
  }
  const login=()=>call('/api/login','POST',{username:'testuser',password});
  return {call,login,env,dir};
}
function data(){const s=initialState();const today=todayIn('Asia/Jakarta');s.profile={startDate:today,baselineKg:82,heightCm:156,longTermGoalKg:60,timeZone:'Asia/Jakarta'};s.targets=[{effectiveDate:today,proteinG:90,movementMinutes:30,strengthSessions:3}];return s;}
test('No public access to account state or writes; reject cross-origin login',async t=>{
  const {call}=await setup(t);
  assert.equal((await call('/api/state')).status,401);
  assert.equal((await call('/api/state','PUT',data())).status,401);
  assert.equal((await call('/api/login','POST',{username:'testuser',password},'','https://other.example')).status,403);
  assert.equal((await call('/api/login','POST',{username:'testuser',password:'wrong'})).status,401);
});
test('Separate sessions share saved state, reject stale writes, logout revokes cookie',async t=>{
  const {call,login}=await setup(t);const a=await login(),b=await login();
  assert.equal(a.status,200);assert.match(a.headers['set-cookie'],/HttpOnly; SameSite=Strict/);
  assert.equal((await call('/api/state','PUT',data(),a.cookie)).status,200);
  const read=await call('/api/state','GET',undefined,b.cookie);assert.equal(read.body.profile.baselineKg,82);assert.equal(read.body.meta.revision,1);
  assert.equal((await call('/api/state','PUT',data(),b.cookie)).status,409);
  const changed=read.body;changed.profile.heightCm=157;
  assert.equal((await call('/api/state','PUT',changed,b.cookie)).status,200);
  assert.equal((await call('/api/state','GET',undefined,a.cookie)).body.profile.heightCm,157);
  assert.equal((await call('/api/logout','POST',undefined,a.cookie)).status,200);
  assert.equal((await call('/api/state','GET',undefined,a.cookie)).status,401);
  assert.equal((await call('/api/session','GET',undefined,b.cookie)).status,200);
});
test('Concurrent writes have one winner; deletion keeps revision and rejects old data',async t=>{
  const {call,login}=await setup(t),{cookie}=await login();
  const results=await Promise.all([call('/api/state','PUT',data(),cookie),call('/api/state','PUT',data(),cookie)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.equal((await call('/api/state','DELETE',{revision:0},cookie)).status,409);
  const cleared=await call('/api/state','DELETE',{revision:1},cookie);assert.equal(cleared.body.profile,null);assert.equal(cleared.body.meta.revision,2);
  assert.equal((await call('/api/state','PUT',data(),cookie)).status,409);
  const fresh=data();fresh.meta.revision=2;assert.equal((await call('/api/state','PUT',fresh,cookie)).status,200);
});
test('Rate limit is shared and credentials do not enter stored session data',async t=>{
  const {call,login,dir}=await setup(t);await login();
  const raw=await readFile(join(dir,'store.json'),'utf8');assert.ok(!raw.includes(password));
  for(let i=0;i<19;i++)await call('/api/login','POST',{username:'testuser',password:'wrong'});
  assert.equal((await login()).status,429);
});
test('Password rotation revokes sessions; production refuses local storage',async t=>{
  const {call,login,env}=await setup(t),{cookie}=await login();
  env.EPIC_PASSWORD_HASH=await hashPassword('replacement-password');
  assert.equal((await call('/api/state','GET',undefined,cookie)).status,401);
  env.VERCEL='1';assert.equal((await call('/api/state','GET',undefined,cookie)).status,503);
});
test('Malformed data is rejected without replacing saved state',async t=>{
  const {call,login}=await setup(t),{cookie}=await login();const invalid=data();invalid.targets[0].strengthSessions=8;
  assert.equal((await call('/api/state','PUT',invalid,cookie)).status,400);
  assert.equal((await call('/api/state','GET',undefined,cookie)).body.profile,null);
});
