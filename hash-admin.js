const { hashPassword } = require('./server/auth.ts'); // adjust path if needed

(async () => {
 const password = 'Admin-Dopic-1!2@'; // put your desired password here
 const hash = await hashPassword(password);
 console.log(hash);
})();
