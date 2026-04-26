-- Seed podaci za HairStudio
-- Pokreni ovaj fajl da popuniš bazu podacima

-- 1. Kreiraj 3 frizera (User)
-- Lozinke (bcrypt): marija@salon.com → marija123 | stefan@salon.com → stefan123 | marko@salon.com → marko123
INSERT INTO "User" (name, email, password, phone, role, "createdAt", "updatedAt") VALUES
('Marija Jovanović', 'marija@salon.com', '$2b$10$hthKUevCQibWY0n9v4W/Y.WbZqGz0Rtm4o7h6vvokhYmbU70z/Ine', '+381 64 123 4567', 'STYLIST', NOW(), NOW()),
('Stefan Petrović', 'stefan@salon.com', '$2b$10$P43ZyU7w2vmoPDa90ZVA/OQO20v3e5aw80qF/0oS9iyCeEOB0TGAq', '+381 64 234 5678', 'STYLIST', NOW(), NOW()),
('Marko Nikolić', 'marko@salon.com', '$2b$10$XpTDf/9F6ASr4N2Vx.oXiODjLpFprIqovDtdlkQbxaj7oxXDQv.Sm', '+381 64 345 6789', 'STYLIST', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. Kreiraj Stylist profile
INSERT INTO "Stylist" ("userId", rating, "totalReviews", bio, "yearsOfExperience", "isActive", "createdAt", "updatedAt")
SELECT 
    u.id,
    CASE u.email
        WHEN 'marija@salon.com' THEN 4.9
        WHEN 'stefan@salon.com' THEN 4.7
        WHEN 'marko@salon.com' THEN 4.8
    END as rating,
    CASE u.email
        WHEN 'marija@salon.com' THEN 127
        WHEN 'stefan@salon.com' THEN 89
        WHEN 'marko@salon.com' THEN 56
    END as totalReviews,
    CASE u.email
        WHEN 'marija@salon.com' THEN 'Specijalizovana za fade šišanje i moderno stilizovanje. Iskustvo od 5 godina.'
        WHEN 'stefan@salon.com' THEN 'Ekspert za farbanje i žensko šišanje. Profesionalac sa 8 godina iskustva.'
        WHEN 'marko@salon.com' THEN 'Specijalizovan za bradicu i klasično šišanje. Precizan i pažljiv.'
    END as bio,
    CASE u.email
        WHEN 'marija@salon.com' THEN 5
        WHEN 'stefan@salon.com' THEN 8
        WHEN 'marko@salon.com' THEN 3
    END as yearsOfExperience,
    true,
    NOW(),
    NOW()
FROM "User" u
WHERE u.role = 'STYLIST'
ON CONFLICT ("userId") DO NOTHING;

-- 3. Kreiraj usluge
INSERT INTO "Service" (name, description, duration, price, category, "isActive", "createdAt", "updatedAt") VALUES
-- Muško šišanje
('Fade šišanje', 'Moderno fade šišanje sa preciznim prelazima', 45, 1500, 'MENS_HAIRCUT', true, NOW(), NOW()),
('Fade šišanje sa pranjem', 'Fade šišanje sa pranjem i negom kose', 60, 2000, 'MENS_HAIRCUT', true, NOW(), NOW()),
('Obično šišanje sa pranjem', 'Klasično šišanje sa pranjem', 50, 1800, 'MENS_HAIRCUT', true, NOW(), NOW()),
('Šišanje na 0', 'Potpuno šišanje na 0', 30, 1000, 'MENS_HAIRCUT', true, NOW(), NOW()),
('Klasično šišanje', 'Tradicionalno klasično šišanje', 40, 1200, 'MENS_HAIRCUT', true, NOW(), NOW()),
('Moderno šišanje', 'Savremeno šišanje po najnovijim trendovima', 50, 1600, 'MENS_HAIRCUT', true, NOW(), NOW()),
-- Brada
('Trim brada', 'Skraćivanje i oblikovanje brade', 20, 800, 'BEARD', true, NOW(), NOW()),
('Fade brada', 'Fade efekat na bradi sa preciznim prelazima', 30, 1200, 'BEARD', true, NOW(), NOW()),
('Brada sa pranjem', 'Trim brade sa pranjem i negom', 25, 1000, 'BEARD', true, NOW(), NOW()),
('Brada na 0', 'Potpuno brijanje brade', 15, 600, 'BEARD', true, NOW(), NOW()),
('Oblikovanje brade', 'Precizno oblikovanje i stilizovanje brade', 35, 1400, 'BEARD', true, NOW(), NOW()),
-- Žensko šišanje
('Šišanje (kratko)', 'Šišanje kratke kose', 60, 2500, 'WOMENS_HAIRCUT', true, NOW(), NOW()),
('Šišanje (srednje)', 'Šišanje srednje duge kose', 75, 3000, 'WOMENS_HAIRCUT', true, NOW(), NOW()),
('Šišanje (dugo)', 'Šišanje duge kose', 90, 3500, 'WOMENS_HAIRCUT', true, NOW(), NOW()),
('Šišanje sa pranjem', 'Šišanje sa pranjem i negom', 80, 3200, 'WOMENS_HAIRCUT', true, NOW(), NOW()),
('Frizura', 'Kompleksna frizura sa stilizovanjem', 120, 4500, 'WOMENS_HAIRCUT', true, NOW(), NOW()),
-- Farbanje
('Farbanje (puna boja)', 'Potpuno farbanje kose u jednu boju', 120, 4500, 'COLORING', true, NOW(), NOW()),
('Meliranje', 'Meliranje kose sa više nijansi', 180, 6000, 'COLORING', true, NOW(), NOW()),
('Balayage', 'Balayage tehnika farbanja', 240, 8000, 'COLORING', true, NOW(), NOW()),
('Ombre', 'Ombre efekat sa prelazom boja', 200, 7000, 'COLORING', true, NOW(), NOW()),
('Toniranje', 'Toniranje postojeće boje', 90, 3000, 'COLORING', true, NOW(), NOW()),
-- Nega
('Pranje kose', 'Profesionalno pranje kose', 30, 800, 'CARE', true, NOW(), NOW()),
('Nega kose', 'Dubinska nega kose sa maskom', 60, 2000, 'CARE', true, NOW(), NOW()),
('Masaza glave', 'Relaksirajuća masaža glave', 20, 1000, 'CARE', true, NOW(), NOW()),
('Tretman kose', 'Kompleksan tretman za očuvanje zdravlja kose', 90, 3500, 'CARE', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 4. Poveži frizere sa uslugama
-- Marija - ŽENSKE usluge (žensko šišanje, farbanje i nega) - BEZ muškog šišanja i brade
INSERT INTO "ServiceStylist" ("stylistId", "serviceId")
SELECT s.id, se.id
FROM "Stylist" s
CROSS JOIN "Service" se
WHERE s."userId" = (SELECT id FROM "User" WHERE email = 'marija@salon.com')
AND se.category IN ('WOMENS_HAIRCUT', 'COLORING', 'CARE')
ON CONFLICT ("stylistId", "serviceId") DO NOTHING;

-- Stefan i Marko - SAMO MUŠKE usluge (muško šišanje i brada)
INSERT INTO "ServiceStylist" ("stylistId", "serviceId")
SELECT s.id, se.id
FROM "Stylist" s
CROSS JOIN "Service" se
WHERE s."userId" IN (
  SELECT id FROM "User" WHERE email IN ('stefan@salon.com', 'marko@salon.com')
)
AND se.category IN ('MENS_HAIRCUT', 'BEARD')
ON CONFLICT ("stylistId", "serviceId") DO NOTHING;




