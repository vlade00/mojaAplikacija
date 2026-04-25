-- SQL upit za promenu Stefan-ove lozinke
-- Lozinka: stefan123
-- Hash je generisan sa bcrypt (10 rounds)

UPDATE "User" 
SET password = '$2b$10$nffaEeIFRsjwhrZErYWpW.9sGCaGoeKq0llioWOuCOaLhk6a12/O6', 
    "updatedAt" = NOW() 
WHERE email = 'stefan@salon.com';

-- Provera da li je ažurirano:
-- SELECT id, name, email FROM "User" WHERE email = 'stefan@salon.com';

