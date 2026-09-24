import * as DB from './storage.js';
import {switcher} from './i18n.js';
let pending;
export function askLogin(){
  if(pending)return pending;
  pending=new Promise(resolve=>{
    const root=document.createElement('div');root.id='auth-root';
    root.innerHTML=`<main class="auth-screen"><header class="onboarding-header"><div class="brand">epic<small>Diet tracker</small></div>${switcher()}</header><section class="card auth-card"><span class="eyebrow">Ruang pribadi kamu</span><h1>Selamat datang kembali</h1><p class="muted">Masuk untuk melanjutkan perjalananmu.</p><form id="login-form"><div class="field"><label for="login-username">Username</label><input class="input" id="login-username" name="username" autocomplete="username" required maxlength="100"></div><div class="field"><label for="login-password">Password</label><input class="input" id="login-password" name="password" type="password" autocomplete="current-password" required maxlength="256"></div><p id="login-error" class="error-banner" role="alert" hidden></p><button class="btn primary wide" type="submit">Masuk</button></form><p class="small muted spacer-top">Akun pribadi. Tidak ada pendaftaran publik.</p></section></main>`;
    const app=document.querySelector('#app');app.inert=true;app.setAttribute('aria-hidden','true');document.body.append(root);
    root.querySelector('input').focus();
    root.querySelector('form').addEventListener('submit',async event=>{
      event.preventDefault();event.stopPropagation();const form=event.target,button=form.querySelector('button'),error=root.querySelector('#login-error');button.disabled=true;error.hidden=true;
      try{await DB.login(form.elements.username.value.trim(),form.elements.password.value);form.elements.password.value='';root.remove();app.inert=false;app.removeAttribute('aria-hidden');pending=null;resolve();}
      catch(e){error.textContent=e.message;error.hidden=false;form.elements.password.value='';}
      finally{button.disabled=false;}
    });
  });return pending;
}
DB.onLoginRequired(askLogin);
