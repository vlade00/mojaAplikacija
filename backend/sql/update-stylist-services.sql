-- SQL upit za ažuriranje dodela usluga frizerima
-- Marija: žensko šišanje, farbanje i nega (bez muškog šišanja i brade)
-- Stefan i Marko: samo muško šišanje i brada

-- 1. Obriši sve postojeće dodele usluga za ove frizere
DELETE FROM "ServiceStylist"
WHERE "stylistId" IN (
  SELECT s.id
  FROM "Stylist" s
  JOIN "User" u ON s."userId" = u.id
  WHERE u.email IN ('marija@salon.com', 'stefan@salon.com', 'marko@salon.com')
);

-- 2. Dodeli usluge Mariji (žensko šišanje, farbanje i nega)
INSERT INTO "ServiceStylist" ("stylistId", "serviceId")
SELECT s.id, se.id
FROM "Stylist" s
CROSS JOIN "Service" se
WHERE s."userId" = (SELECT id FROM "User" WHERE email = 'marija@salon.com')
AND se.category IN ('WOMENS_HAIRCUT', 'COLORING', 'CARE')
ON CONFLICT ("stylistId", "serviceId") DO NOTHING;

-- 3. Dodeli usluge Stefanu i Marku (muško šišanje i brada)
INSERT INTO "ServiceStylist" ("stylistId", "serviceId")
SELECT s.id, se.id
FROM "Stylist" s
CROSS JOIN "Service" se
WHERE s."userId" IN (
  SELECT id FROM "User" WHERE email IN ('stefan@salon.com', 'marko@salon.com')
)
AND se.category IN ('MENS_HAIRCUT', 'BEARD')
ON CONFLICT ("stylistId", "serviceId") DO NOTHING;

