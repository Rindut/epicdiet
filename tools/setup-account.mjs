import {randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {hashPassword} from '../server/account.mjs';
const username=process.argv[2]||'rina';
if(!/^[a-zA-Z0-9_-]{3,40}$/.test(username))throw Error('Use 3–40 letters, digits, underscores or hyphens.');
const password=randomBytes(18).toString('base64url');
const hash=await hashPassword(password);
// Never overwrite an existing account or server data.
await writeFile(new URL('../.env.local',import.meta.url),`EPIC_USERNAME=${username}\nEPIC_PASSWORD_HASH=${hash}\nEPIC_ORIGIN=http://localhost:3040\nEPIC_STORAGE=local\n`,{flag:'wx',mode:0o600});
console.log(`Local account created. Username: ${username}\nPassword (shown once): ${password}\nCredentials are not published or committed. Keep this password in your password manager.`);
