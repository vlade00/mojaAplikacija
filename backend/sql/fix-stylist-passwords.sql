-- Ako su frizeri već uvezeni starim seed-om (pogrešan bcrypt), pokreni ovo u Neon/pgAdmin.
-- Lozinke: marija123 | stefan123 | marko123

UPDATE "User" SET password = '$2b$10$hthKUevCQibWY0n9v4W/Y.WbZqGz0Rtm4o7h6vvokhYmbU70z/Ine', "updatedAt" = NOW()
WHERE email = 'marija@salon.com';

UPDATE "User" SET password = '$2b$10$P43ZyU7w2vmoPDa90ZVA/OQO20v3e5aw80qF/0oS9iyCeEOB0TGAq', "updatedAt" = NOW()
WHERE email = 'stefan@salon.com';

UPDATE "User" SET password = '$2b$10$XpTDf/9F6ASr4N2Vx.oXiODjLpFprIqovDtdlkQbxaj7oxXDQv.Sm', "updatedAt" = NOW()
WHERE email = 'marko@salon.com';
