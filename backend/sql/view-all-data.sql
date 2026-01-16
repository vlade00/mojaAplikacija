-- Vidi sve podatke u bazi

-- 1. Svi frizeri
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    s.rating,
    s."totalReviews",
    s.bio,
    s."yearsOfExperience"
FROM "User" u
JOIN "Stylist" s ON u.id = s."userId"
WHERE u.role = 'STYLIST'
ORDER BY s.rating DESC;

-- 2. Sve usluge
SELECT 
    id,
    name,
    description,
    duration,
    price,
    category
FROM "Service"
WHERE "isActive" = true
ORDER BY category, name;

-- 3. Koje usluge radi svaki frizer
SELECT 
    u.name as frizer,
    s.name as usluga,
    s.price,
    s.duration,
    s.category
FROM "User" u
JOIN "Stylist" st ON u.id = st."userId"
JOIN "ServiceStylist" ss ON st.id = ss."stylistId"
JOIN "Service" s ON ss."serviceId" = s.id
ORDER BY u.name, s.category, s.name;




