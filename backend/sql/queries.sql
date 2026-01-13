-- Korisni SQL upiti za rad sa bazom

-- 1. Vidi sve frizere
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

-- 2. Vidi sve usluge
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

-- 3. Vidi usluge po kategoriji
SELECT 
    name,
    duration,
    price
FROM "Service"
WHERE category = 'MENS_HAIRCUT'  -- Možeš promeniti: BEARD, WOMENS_HAIRCUT, COLORING, CARE
AND "isActive" = true
ORDER BY price;

-- 4. Vidi koje usluge radi određeni frizer
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
WHERE u.email = 'marija@salon.com'  -- Promeni email za drugog frizera
ORDER BY s.category, s.name;

-- 5. Vidi sve rezervacije
SELECT 
    a.id,
    a.date,
    a.time,
    a.status,
    a.price,
    u_customer.name as klijent,
    u_stylist.name as frizer,
    s.name as usluga
FROM "Appointment" a
JOIN "User" u_customer ON a."customerId" = u_customer.id
JOIN "Stylist" st ON a."stylistId" = st.id
JOIN "User" u_stylist ON st."userId" = u_stylist.id
JOIN "Service" s ON a."serviceId" = s.id
ORDER BY a.date DESC, a.time DESC;

-- 6. Broj usluga po kategoriji
SELECT 
    category,
    COUNT(*) as broj_usluga,
    AVG(price) as prosecna_cena,
    SUM(duration) as ukupno_vreme
FROM "Service"
WHERE "isActive" = true
GROUP BY category
ORDER BY category;

-- 7. Statistika frizera
SELECT 
    u.name as frizer,
    s.rating,
    s."totalReviews",
    COUNT(DISTINCT ss."serviceId") as broj_usluga,
    COUNT(DISTINCT a.id) as ukupno_rezervacija
FROM "User" u
JOIN "Stylist" s ON u.id = s."userId"
LEFT JOIN "ServiceStylist" ss ON s.id = ss."stylistId"
LEFT JOIN "Appointment" a ON s.id = a."stylistId"
WHERE u.role = 'STYLIST'
GROUP BY u.id, u.name, s.rating, s."totalReviews"
ORDER BY s.rating DESC;

