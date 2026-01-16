# Sve što smo uradili - Kompletan Pregled

## 📋 Pregled

**HairStudio** - Full-stack aplikacija za frizerski salon

**Status:** Backend je gotov! ✅

---

## 🎯 Šta smo uradili - Redosled

### 1. Setup Projekta i Baze Podataka

#### Git i GitHub
- ✅ Povezali projekat sa GitHub-om
- ✅ Kreirali repozitorijum
- ✅ Commit-ovali i push-ovali kod

**Zašto?**
- Čuvanje koda
- Podešavanje verzija
- Pokriva master predmet: "Upravljanje konfiguracijom softvera"

---

#### Docker i PostgreSQL Baza
- ✅ Setup-ovali PostgreSQL bazu preko Docker-a
- ✅ Baza radi na `localhost:5434`
- ✅ Database: `hairstudio`
- ✅ Username/Password: `postgres/postgres`

**Šta je Docker?**
- Virtuelna kutija koja sadrži bazu podataka
- Ne moraš da instaliraš PostgreSQL na računar
- Lako pokretanje: `docker-compose up -d`

**Zašto?**
- Pokriva master predmet: "Alati i okruženja za produkciju složenih softverskih sistema"
- Lako podešavanje okruženja

---

### 2. Backend Setup

#### Instalirane Dependencies
```json
{
  "express": "Web framework za API",
  "typescript": "JavaScript sa tipovima",
  "pg": "PostgreSQL driver (direktno SQL upiti)",
  "cors": "Cross-Origin Resource Sharing",
  "jsonwebtoken": "JWT tokeni za autentifikaciju",
  "bcrypt": "Hash-ovanje lozinki"
}
```

**Zašto ove biblioteke?**
- **Express** - najpopularniji Node.js framework za API
- **TypeScript** - tipovi za sigurniji kod
- **pg** - direktno SQL (bez ORM-a)
- **cors** - dozvoljava frontend-u da pristupa API-ju
- **jsonwebtoken** - sigurna autentifikacija
- **bcrypt** - sigurno čuvanje lozinki

---

#### Struktura Projekta
```
backend/
├── src/
│   ├── db/
│   │   └── connection.ts    # Database connection (pg pool)
│   ├── routes/
│   │   ├── services.ts      # Services API endpoints
│   │   ├── stylists.ts      # Stylists API endpoints
│   │   ├── appointments.ts  # Appointments API endpoints
│   │   └── auth.ts          # Authentication endpoints
│   ├── middleware/
│   │   └── auth.ts          # JWT authentication middleware
│   └── index.ts             # Main server file
├── sql/
│   ├── create-tables.sql    # SQL za kreiranje tabela
│   ├── seed-data.sql        # Seed podaci (3 frizera, 25 usluga)
│   └── queries.sql         # Korisni SQL upiti
└── package.json
```

**Zašto ovakva struktura?**
- Organizovan kod
- Lakše održavanje
- Pokriva master predmet: "Napredne softverske arhitekture"

---

### 3. Baza Podataka

#### Kreirane Tabele
1. **User** - Korisnici (klijenti, frizeri, admin)
   - `id`, `name`, `email`, `password`, `phone`, `role`, `createdAt`, `updatedAt`
   
2. **Stylist** - Frizeri (profil sa ocenama)
   - `id`, `userId`, `rating`, `totalReviews`, `bio`, `yearsOfExperience`, `isActive`
   
3. **Service** - Usluge (šišanje, brada, farbanje, itd.)
   - `id`, `name`, `description`, `duration`, `price`, `category`, `isActive`
   
4. **ServiceStylist** - Veza između frizera i usluga (many-to-many)
   - `id`, `stylistId`, `serviceId`
   
5. **Appointment** - Rezervacije
   - `id`, `customerId`, `stylistId`, `serviceId`, `date`, `time`, `status`, `price`, `notes`
   
6. **Review** - Ocene
   - `id`, `appointmentId`, `customerId`, `stylistId`, `rating`, `comment`

**Zašto ove tabele?**
- Pokriva master predmet: "Napredne baze podataka"
- Relacione tabele (JOIN upiti)
- Normalizacija podataka

---

#### Seed Podaci
- ✅ 3 frizera (Marija, Stefan, Marko)
- ✅ 25 usluga sa cenama:
  - Muško šišanje (6 usluga)
  - Brada (5 usluga)
  - Žensko šišanje (5 usluga)
  - Farbanje (5 usluga)
  - Nega (4 usluge)

**Zašto seed podaci?**
- Testiranje aplikacije
- Demo podaci za prezentaciju

---

### 4. API Endpoints

#### Services (Usluge) - Javni Endpoints
- ✅ `GET /api/services` - Vrati sve usluge
- ✅ `GET /api/services/:id` - Vrati jednu uslugu
- ✅ `GET /api/services/category/:category` - Vrati usluge po kategoriji

**Zašto javni?**
- Svi mogu da vide usluge (nema potrebe za login)

---

#### Stylists (Frizeri) - Javni Endpoints
- ✅ `GET /api/stylists` - Vrati sve frizere
- ✅ `GET /api/stylists/:id` - Vrati jednog frizera
- ✅ `GET /api/stylists/:id/services` - Vrati usluge koje radi frizer

**Zašto javni?**
- Svi mogu da vide frizere (nema potrebe za login)

---

#### Appointments (Rezervacije) - Zaštićeni Endpoints
- ✅ `GET /api/appointments` - Vrati sve rezervacije (javno)
- ✅ `GET /api/appointments/:id` - Vrati jednu rezervaciju (javno)
- ✅ `POST /api/appointments` - Kreiraj rezervaciju (zaštićeno - samo ulogovani)
- ✅ `PUT /api/appointments/:id` - Ažuriraj rezervaciju (zaštićeno - samo vlasnik)
- ✅ `DELETE /api/appointments/:id` - Obriši rezervaciju (zaštićeno - samo vlasnik)

**Zašto zaštićeno?**
- Samo ulogovani korisnici mogu da kreiraju rezervacije
- Samo vlasnik rezervacije može da je ažurira/briše

---

#### Authentication (Autentifikacija)
- ✅ `POST /api/auth/register` - Registracija korisnika
- ✅ `POST /api/auth/login` - Prijava korisnika

**Kako radi?**
1. **Register:**
   - Korisnik šalje: `name`, `email`, `password`, `role`
   - Server hash-uje lozinku (bcrypt)
   - Server kreira korisnika u bazi
   - Server generiše JWT token
   - Server vraća korisnika i token

2. **Login:**
   - Korisnik šalje: `email`, `password`
   - Server proverava lozinku (bcrypt.compare)
   - Server generiše JWT token
   - Server vraća korisnika i token

**Zašto JWT token?**
- Sigurnost (ne šalješ lozinku u svakom zahtevu)
- Brzina (server ne proverava lozinku u bazi svaki put)
- Privremen (traje 7 dana)

---

### 5. Middleware (Autentifikacija)

#### `authenticate` Middleware
**Šta radi?**
- Proverava JWT token iz header-a (`Authorization: Bearer <token>`)
- Verifikuje token
- Dodaje user informacije u `req.user`
- Ako token nije validan → vraća 401

**Gde se koristi?**
- Na zaštićenim rutama (POST, PUT, DELETE appointments)

**Kako funkcioniše?**
```javascript
// U zahtevu
Headers: {
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Middleware proverava token
const decoded = jwt.verify(token, JWT_SECRET);
// decoded = { userId: 4, email: "test@example.com", role: "CUSTOMER" }

// Dodaje u request
req.user = decoded;
```

---

### 6. Database Connection

#### `connection.ts`
**Šta radi?**
- Kreira connection pool za PostgreSQL
- Koristi `DATABASE_URL` iz `.env` fajla
- Helper funkcija `query()` za SQL upite

**Zašto pool?**
- Efikasnije korišćenje konekcija
- Automatsko upravljanje konekcijama

**Kako se koristi?**
```javascript
const result = await query('SELECT * FROM "User" WHERE id = $1', [id]);
```

---

## 🔄 Kako sve funkcioniše zajedno?

### Primer: Kreiranje rezervacije

```
1. Korisnik (Postman)
   ↓
   POST /api/appointments
   Headers: Authorization: Bearer <token>
   Body: { stylistId: 1, serviceId: 1, date: "2024-01-20", time: "10:00" }
   
2. Server (Express)
   ↓
   authenticate middleware
   - Proverava token
   - Dodaje req.user = { userId: 4, ... }
   
3. appointments.ts route handler
   ↓
   - Uzima userId iz req.user (automatski!)
   - Proverava da li usluga postoji
   - Proverava da li frizer postoji
   - Uzima cenu iz usluge
   - Kreira rezervaciju u bazi
   
4. Database (PostgreSQL)
   ↓
   INSERT INTO "Appointment" ...
   
5. Server vraća odgovor
   ↓
   { id: 1, customerId: 4, stylistId: 1, ... }
   
6. Korisnik dobija rezervaciju
```

---

## 🎓 Kako ovo pokriva master predmete?

### 1. "Napredne baze podataka"
- ✅ PostgreSQL (relaciona baza)
- ✅ SQL upiti (JOIN, WHERE, ORDER BY)
- ✅ Tabele, relacije, indeksi
- ✅ Normalizacija podataka

### 2. "Napredne softverske arhitekture"
- ✅ Clean Architecture (routes, middleware, services)
- ✅ RESTful API dizajn
- ✅ Separation of Concerns
- ✅ Middleware pattern

### 3. "Alati i okruženja za produkciju složenih softverskih sistema"
- ✅ Docker (kontejnerizacija)
- ✅ docker-compose (orchestration)
- ✅ Environment variables (.env)
- ✅ Git/GitHub (version control)

### 4. "Proces i metodologije razvoja softvera"
- ✅ Iterativni razvoj
- ✅ Testiranje (Postman)
- ✅ Dokumentacija
- ✅ Code organization

### 5. "Upravljanje konfiguracijom softvera"
- ✅ Git/GitHub
- ✅ Version control
- ✅ Commit history
- ✅ Repository management

---

## 📊 Statistika - Šta imamo?

### Backend
- ✅ 4 route fajlova (services, stylists, appointments, auth)
- ✅ 1 middleware fajl (auth)
- ✅ 1 database connection fajl
- ✅ 8+ API endpoints
- ✅ JWT autentifikacija
- ✅ Zaštićene rute

### Baza Podataka
- ✅ 6 tabela
- ✅ 3 enuma (UserRole, ServiceCategory, AppointmentStatus)
- ✅ 3 frizera
- ✅ 25 usluga
- ✅ Seed podaci

### Dokumentacija
- ✅ README fajlovi
- ✅ SQL upiti
- ✅ Postman uputstva
- ✅ Docker uputstva

---

## ✅ Šta je gotovo?

### Backend - GOTOVO! ✅
- ✅ Server setup
- ✅ Database connection
- ✅ API endpoints
- ✅ Authentication
- ✅ Middleware
- ✅ Error handling
- ✅ Testiranje (Postman)

### Baza Podataka - GOTOVO! ✅
- ✅ Tabele kreirane
- ✅ Seed podaci
- ✅ Relacije

---

## 🚀 Šta sledi?

### Frontend (React) - NAREDNI KORAK
- Setup React projekta
- Povezivanje sa backend API-jem
- UI prema mockup-u
- Login/Register forma
- Rezervacije (lista, kreiranje)

---

## 🎯 Rezime

**Šta smo uradili:**
1. ✅ Setup projekta (Git, Docker, Backend)
2. ✅ Baza podataka (PostgreSQL, tabele, seed podaci)
3. ✅ API endpoints (services, stylists, appointments, auth)
4. ✅ Autentifikacija (JWT tokens, middleware)
5. ✅ Testiranje (Postman)

**Kako funkcioniše:**
- Backend (Node.js + Express) → API endpoints
- Database (PostgreSQL) → Čuva podatke
- Authentication (JWT) → Sigurnost
- Middleware → Zaštita ruta

**Zašto je ovo dobro:**
- ✅ Pokriva sve master predmete
- ✅ Profesionalna struktura
- ✅ Sigurno (JWT, bcrypt)
- ✅ Testirano (Postman)

---

**Backend je gotov! Sada možemo da krenemo sa Frontend-om!** 🎉

