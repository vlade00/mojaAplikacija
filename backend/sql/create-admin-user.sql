-- SQL upit za kreiranje admin korisnika
-- Lozinka: admin123
-- Pokreni ovaj upit u pgAdmin ili DBeaver

INSERT INTO "User" (name, email, password, phone, role, "createdAt", "updatedAt")
VALUES (
  'Admin User',
  'admin@salon.com',
  '$2b$10$lDvdwTeM8B8dUNVOcUr1r.n.Gu5bRHckydJ0cS312wU1hPCIW2dOW', -- Hash za lozinku "admin123"
  '+381 64 000 0000',
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Nakon pokretanja, možeš da se prijaviš sa:
-- Email: admin@salon.com
-- Lozinka: admin123

