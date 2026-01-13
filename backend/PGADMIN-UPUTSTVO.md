# Kako koristiti pgAdmin sa HairStudio bazom

## Povezivanje na bazu

### Korak 1: Otvori pgAdmin
- Otvori pgAdmin aplikaciju

### Korak 2: Kreiraj novu konekciju
1. Desni klik na "Servers" → Create → Server
2. General tab:
   - Name: `HairStudio Local`
3. Connection tab:
   - Host name/address: `localhost`
   - Port: `5432`
   - Maintenance database: `hairstudio`
   - Username: `postgres`
   - Password: `postgres`
4. Klikni "Save"

### Korak 3: Proveri konekciju
- Ako je uspešno, videćeš `HairStudio Local` u levoj strani
- Proširi: `HairStudio Local` → `Databases` → `hairstudio` → `Schemas` → `public` → `Tables`

## Tabele u bazi

Videćeš sledeće tabele:
- `User` - Korisnici (klijenti, frizeri, admin)
- `Stylist` - Frizeri (profil)
- `Service` - Usluge
- `ServiceStylist` - Veza između frizera i usluga
- `Appointment` - Rezervacije
- `Review` - Ocene

## Kako da vidiš podatke

1. Desni klik na tabelu (npr. `Service`)
2. View/Edit Data → All Rows
3. Videćeš sve podatke u tabeli

## Kako da pokreneš SQL upit

1. Klikni na "Query Tool" (ikonica SQL)
2. Ukucaj SQL upit:
```sql
SELECT * FROM "Service" WHERE "isActive" = true;
```
3. Klikni "Execute" (F5)

## Korisni SQL upiti

### Vidi sve frizere
```sql
SELECT 
    u.name,
    u.email,
    s.rating,
    s."totalReviews",
    s.bio
FROM "User" u
JOIN "Stylist" s ON u.id = s."userId"
WHERE u.role = 'STYLIST';
```

### Vidi sve usluge
```sql
SELECT 
    name,
    price,
    duration,
    category
FROM "Service"
WHERE "isActive" = true
ORDER BY category, name;
```

### Vidi koje usluge radi frizer
```sql
SELECT 
    u.name as frizer,
    s.name as usluga,
    s.price
FROM "User" u
JOIN "Stylist" st ON u.id = st."userId"
JOIN "ServiceStylist" ss ON st.id = ss."stylistId"
JOIN "Service" s ON ss."serviceId" = s.id
WHERE u.email = 'marija@salon.com';
```

## Važno

- Uvek koristi **navodnike** oko imena tabela: `"User"`, `"Service"`
- PostgreSQL je case-sensitive za imena sa navodnicima!

