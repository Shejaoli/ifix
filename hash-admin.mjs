import { hashPassword } from './server/auth.ts';

const password = 'Admin-Dopic-1!2@'; // your desired password

(async () => {
 const hash = await hashPassword(password);
 console.log(hash);
})();
