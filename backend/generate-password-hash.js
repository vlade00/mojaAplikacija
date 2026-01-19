// Privremeni skript za generisanje bcrypt hash-a za lozinku
// Pokreni: node generate-password-hash.js

const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'admin123'; // Tvoja lozinka
  const hash = await bcrypt.hash(password, 10);
  console.log('Lozinka:', password);
  console.log('Hash:', hash);
  console.log('\nKoristi ovaj hash u SQL upitu:');
  console.log(`INSERT INTO "User" (name, email, password, phone, role, "createdAt", "updatedAt")`);
  console.log(`VALUES ('Admin User', 'admin@salon.com', '${hash}', '+381 64 000 0000', 'ADMIN', NOW(), NOW());`);
}

generateHash();

