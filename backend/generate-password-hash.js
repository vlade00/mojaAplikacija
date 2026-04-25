// Privremeni skript za generisanje bcrypt hash-a za lozinku
// Pokreni: node generate-password-hash.js <lozinka>
// Primer: node generate-password-hash.js stefan123

const bcrypt = require('bcrypt');

async function generateHash() {
  const password = process.argv[2] || 'admin123'; // Lozinka iz komandne linije ili default
  const hash = await bcrypt.hash(password, 10);
  console.log('\n=== GENERISAN HASH ZA LOZINKU ===');
  console.log('Lozinka:', password);
  console.log('Hash:', hash);
  console.log('\n=== SQL UPIT ZA AŽURIRANJE LOZINKE ===');
  console.log(`UPDATE "User" SET password = '${hash}', "updatedAt" = NOW() WHERE email = 'stefan@salon.com';`);
  console.log('\n=== ILI PREKO POSTMAN-A ===');
  console.log('PUT http://localhost:3000/api/admin/users/<USER_ID>');
  console.log('Body: { "password": "' + password + '" }');
  console.log('\n');
}

generateHash();

