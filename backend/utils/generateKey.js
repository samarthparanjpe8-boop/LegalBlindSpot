const { generateKey } = require('./encryption');

console.log('Your encryption key (add this to backend/.env as ENCRYPTION_KEY):');
console.log(generateKey());
