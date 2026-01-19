-- SQL skripta za kreiranje admin korisnika
-- OVO JE SAMO ZA TESTIRANJE - u produkciji koristi API endpoint!

-- 1. Kreiraj admin korisnika sa hash-ovanom lozinkom
-- Lozinka: "admin123" (hash-ovana sa bcrypt)
-- OVAJ HASH JE ZA LOZINKU "admin123"
INSERT INTO "User" (name, email, password, phone, role, "createdAt", "updatedAt")
VALUES (
  'Admin User',
  'admin@salon.com',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', -- Ovo je hash za "admin123" - ZAMENI SA PRAVIM HASH-OM!
  '+381 64 000 0000',
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- VAŽNO: Gornji hash ($2a$10$rOzJqZqZqZqZqZqZqZqZqO) NIJE pravi hash!
-- Treba da generišeš pravi bcrypt hash za svoju lozinku.

