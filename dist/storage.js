import {load as legacyLoad} from './legacy-storage.js';
let requireLogin=null;
export function onLoginRequired(callback){requireLogin=callback;}
async function request(path,method='GET',data,retry=true){
  let response;
  try{response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});}
  catch{throw Error('Tidak ada koneksi. Isian belum tersimpan; coba lagi setelah online.');}
  let body;try{body=await response.json();}catch{throw Error('Server akun belum tersedia.');}
  if(response.status===401&&retry&&requireLogin){await requireLogin();return request(path,method,data,false);}
  if(!response.ok){const error=Error(body.error||'Permintaan gagal.');error.status=response.status;throw error;}return body;
}
export const session=()=>request('/api/session','GET',undefined,false);
export const login=(username,password)=>request('/api/login','POST',{username,password},false);
export const logout=()=>request('/api/logout','POST');
export const load=()=>request('/api/state');
export const save=state=>request('/api/state','PUT',state);
export const clear=revision=>request('/api/state','DELETE',{revision:revision||0});
export async function legacy(){try{return await legacyLoad();}catch{return null;}}
