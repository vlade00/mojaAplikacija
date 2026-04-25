# HairStudio - AI Context Document
## Dokument za AI asistenta - Kompletan pregled projekta

---

## 🎯 STATUS PROJEKTA

**Projekat je ZAVRŠEN i FUNKCIONALAN.**

- ✅ Backend API (Node.js + Express + TypeScript)
- ✅ Frontend (React + TypeScript + TailwindCSS)
- ✅ Database (PostgreSQL u Docker-u)
- ✅ Authentication (JWT)
- ✅ Sve funkcionalnosti implementirane

---

## 📋 ŠTA JE URAĐENO

### BACKEND (100% završeno)

**Lokacija**: `backend/src/`

**Routes (API endpoints):**
1. **`routes/auth.ts`** - Autentifikacija
   - `POST /api/auth/register` - Registracija korisnika
   - `POST /api/auth/login` - Login (vraća JWT token)
   - `PUT /api/auth/profile` - Ažuriranje profila (name, email, phone, avatarUrl)
   - `PUT /api/auth/change-password` - Promena lozinke
   - Validacija: email i phone moraju biti jedinstveni

2. **`routes/services.ts`** - Usluge
   - `GET /api/services` - Lista svih usluga
   - `GET /api/services/:id` - Jedna usluga
   - `GET /api/services/category/:category` - Usluge po kategoriji

3. **`routes/stylists.ts`** - Frizeri
   - `GET /api/stylists` - Lista svih frizera
   - `GET /api/stylists/:id` - Jedan frizer
   - `GET /api/stylists/:id/services` - Usluge koje radi frizer
   - `GET /api/stylists/:id/available/:date` - Dostupni termini za frizera

4. **`routes/appointments.ts`** - Rezervacije
   - `GET /api/appointments` - Sve rezervacije (zaštićeno, vraća samo korisnikove)
   - `GET /api/appointments/:id` - Jedna rezervacija
   - `POST /api/appointments` - Kreiranje rezervacije
     - Validacija: samo radni dani (ponedeljak-petak), 8:00-18:00
     - Provera preklapanja termina
     - Zaključavanje vremena
   - `PUT /api/appointments/:id` - Ažuriranje rezervacije
     - Klijent može samo da otkaže (status = CANCELLED)
   - `GET /api/appointments/available/:stylistId` - Dostupni termini

5. **`routes/admin.ts`** - Admin panel (samo ADMIN uloga)
   - `GET /api/admin/users` - Lista korisnika
   - `GET /api/admin/users/:id` - Jedan korisnik
   - `POST /api/admin/users` - Kreiranje korisnika
   - `PUT /api/admin/users/:id` - Ažuriranje korisnika
   - `DELETE /api/admin/users/:id` - Brisanje korisnika
   - `GET /api/admin/stylists` - Lista frizera
   - `GET /api/admin/stylists/:id` - Jedan frizer
   - `POST /api/admin/stylists` - Kreiranje frizera
   - `PUT /api/admin/stylists/:id` - Ažuriranje frizera
   - `DELETE /api/admin/stylists/:id` - Brisanje frizera
   - `GET /api/admin/appointments` - Sve rezervacije
   - `POST /api/admin/stylists/:id/services` - Dodela usluga frizeru

6. **`routes/stylist.ts`** - Stylist panel (samo STYLIST uloga)
   - `GET /api/stylist/appointments` - Rezervacije frizera
   - `PUT /api/stylist/appointments/:id` - Ažuriranje rezervacije (status)

7. **`routes/reviews.ts`** - Ocene
   - `POST /api/reviews` - Kreiranje ocene
     - Automatski ažurira rating frizera (AVG, COUNT)
   - `GET /api/reviews/stylist/:stylistId` - Ocene frizera

**Middleware:**
- `middleware/auth.ts` - JWT autentifikacija i role-based authorization
- `middleware/upload.ts` - File upload za avatare (Multer)

**Database:**
- `db/connection.ts` - PostgreSQL connection pool (max: 20 konekcija)
- Direktni SQL upiti (bez ORM-a)
- Query logging (duration, rows)

### FRONTEND (100% završeno)

**Lokacija**: `frontend/src/`

**Komponente:**
1. **`components/Login.tsx`** - Prijava
   - Email/password forma
   - Leva strana: welcome sekcija + logo
   - Redirect prema ulozi (CUSTOMER → /dashboard, ADMIN → /admin/dashboard, STYLIST → /stylist/panel)

2. **`components/Register.tsx`** - Registracija
   - Samo forma (bez leve strane)
   - Validacija: email i phone moraju biti jedinstveni
   - Nakon registracije: redirect na /login sa success porukom

3. **`components/CustomerDashboard.tsx`** - Customer dashboard
   - **Kartice:**
     - Usluge (lista sa kategorijama)
     - Frizeri (lista sa rating-om)
     - Rezervacije (prikazuje 2 po defaultu, "Prikaži sve" dugme)
     - Profil (modal sa avatar-om, edit, promena lozinke)
   - **Funkcionalnosti:**
     - Rezervisanje termina (dugme "Rezerviši")
     - Pregled rezervacija (status, detalji, otkazivanje)
     - Ocenjivanje frizera (dugme "Oceni Frizera" za COMPLETED rezervacije)
     - Avatar picker (12 avatara - 6 muških, 6 ženskih, DiceBear personas)
     - Edit profil (name, email, phone)
     - Promena lozinke (trenutna + nova)
   - **Header:** Avatar + "Profil" dugme + "Odjavi se"

4. **`components/Booking.tsx`** - Forma za rezervaciju
   - Izbor frizera (filtrirano po usluzi)
   - Izbor datuma (kalendar, samo radni dani)
   - Izbor vremena (8:00-18:00, dostupni termini)
   - Validacija: zaključani termini, radni dani
   - Success poruka na vrhu

5. **`components/AdminDashboard.tsx`** - Admin panel
   - **Tabs:**
     - Overview (statistika)
     - Korisnici (lista 5 po defaultu, "Prikaži sve" dugme)
       - CRUD operacije (Create, Read, Update, Delete)
       - Modal za edit
     - Frizeri (lista 5 po defaultu, "Prikaži sve" dugme)
       - CRUD operacije
       - Dodela usluga frizeru (modal)
     - Rezervacije (lista 5 po defaultu, "Prikaži sve" dugme)
       - Pregled svih rezervacija
   - **Zaštita:** Samo ADMIN može pristupiti (frontend + backend)

6. **`components/StylistPanel.tsx`** - Stylist panel
   - Statistika kartice (ukupno, danas, završeno)
   - Rezervacije (prikaz na vrhu, bez scroll-a)
   - Pregled ocena i komentara
   - Ažuriranje statusa rezervacije

**Services (API pozivi):**
- `services/api.ts` - Axios instance sa base URL i interceptors
- `services/authService.ts` - Auth API pozivi
- `services/appointmentService.ts` - Appointment API pozivi
- `services/serviceService.ts` - Service API pozivi
- `services/stylistService.ts` - Stylist API pozivi
- `services/adminService.ts` - Admin API pozivi
- `services/stylistPanelService.ts` - Stylist panel API pozivi
- `services/reviewService.ts` - Review API pozivi

**Context:**
- `context/AuthContext.tsx` - Global state za autentifikaciju
  - `user` - Trenutni korisnik
  - `isAuthenticated` - Da li je ulogovan
  - `login`, `logout`, `register` - Funkcije
  - `updateUser` - Ažuriranje user state-a (bez reload-a)

**Routing:**
- `App.tsx` - React Router konfiguracija
  - `/login` - Login
  - `/register` - Register
  - `/dashboard` - Customer dashboard (redirect prema ulozi)
  - `/booking` - Booking forma
  - `/admin/dashboard` - Admin dashboard (samo ADMIN)
  - `/stylist/panel` - Stylist panel (samo STYLIST)
  - Protected routes sa `ProtectedRoute`, `AdminRoute`, `StylistRoute`

### DATABASE

**Lokacija**: `backend/sql/`

**Fajlovi:**
- `create-tables.sql` - Struktura baze
  - 6 tabela: User, Stylist, Service, ServiceStylist, Appointment, Review
  - 3 enuma: UserRole, ServiceCategory, AppointmentStatus
  - 8 indeksa za optimizaciju
- `seed-data.sql` - Test podaci
  - 3 frizera: Stefan, Marko (muški), Marija (ženski)
  - 24 usluge (po kategorijama)
  - Dodela usluga: Stefan i Marko (muško sisanje, brada), Marija (žensko sisanje, farbanje, nega)

**Connection:**
- Docker container: `hairstudio-db`
- Port: 5434 (mapping 5434:5432)
- Credentials: postgres/postgres
- Database: hairstudio

---

## 🔧 TEHNIČKI DETALJI

### Authentication Flow:
1. User se registruje → Backend hash-uje password (bcrypt) → Vraća JWT token
2. User se loguje → Backend proverava password → Vraća JWT token
3. Zaštićeni endpoint → Frontend šalje `Authorization: Bearer [token]` → Backend verifikuje token

### Avatar System:
- 12 predefinisanih avatara (DiceBear personas API)
- 6 muških, 6 ženskih
- Avatar URL se čuva u `User.avatarUrl` koloni
- Avatar se prikazuje u header-u i profil modalu
- Ažuriranje bez page reload-a (koristi `updateUser` iz AuthContext)

### Booking Restrictions:
- Samo radni dani (ponedeljak-petak)
- Radno vreme: 8:00-18:00
- Zaključani termini (ne mogu se rezervisati već rezervisani termini)
- Backend validacija + frontend provera dostupnih termina

### Rating System:
- Ocena: 1-5 zvezdica
- Automatski se ažurira `Stylist.rating` (AVG) i `Stylist.totalReviews` (COUNT)
- Mogu oceniti samo COMPLETED rezervacije
- Jedna ocena po rezervaciji (UNIQUE constraint)

### Limited Display:
- Customer Dashboard rezervacije: 2 po defaultu
- Admin Dashboard (korisnici, frizeri, rezervacije): 5 po defaultu
- "Prikaži sve" / "Prikaži manje" dugme

---

## 🐛 POZNATI PROBLEMI / REŠENJA

1. **Avatar column missing** - Rešeno: SQL script `add-avatar-column.sql`
2. **Phone validation** - Rešeno: Backend proverava `phone !== undefined` pre validacije
3. **Avatar update redirect** - Rešeno: Koristi `updateUser` umesto `window.location.reload()`
4. **Rating not updating** - Rešeno: Backend vraća `avgrating` (lowercase) umesto `avgRating`

---

## 📝 VAŽNE NAPOMENE

- **Prisma je uklonjen** - Koristimo direktne SQL upite preko `pg` driver-a
- **Docker port 5434** - Zbog lokalnog PostgreSQL-a na 5432
- **JWT token** - Stateless autentifikacija, token u `Authorization` header-u
- **Role-based access** - Frontend i backend provera uloge
- **Connection pooling** - Max 20 konekcija, idle timeout 30s

---

## 🎓 MASTER'S PREDMETI

Projekat pokriva:
- **Napredne baze podataka** - PostgreSQL, indeksi, JOIN upiti, subqueries, connection pooling
- **Alati i okruženja** - Docker, Git, VS Code, Postman, pgAdmin, npm, build procesi
- **Napredne softverske arhitekture** - 3-tier, RESTful API, JWT, middleware pattern
- **Proces i metodologije** - Git workflow, development proces

---

## 🚀 KAKO POKRENUTI

```bash
# 1. Docker baza
docker-compose up -d

# 2. Backend
cd backend
npm install
npm run dev

# 3. Frontend
cd frontend
npm install
npm start
```

**URLs:**
- Backend: http://localhost:3000
- Frontend: http://localhost:3005
- Database: localhost:5434

---

## 📞 TEST PODACI

**Admin:**
- Email: admin@salon.com
- Password: admin123

**Frizeri:**
- Stefan: stefan@salon.com / stefan123
- Marko: marko@salon.com / marko123
- Marija: marija@salon.com / marija123

**Klijent:**
- Može se registrovati preko Register forme

---

**OVO JE KOMPLETAN PREGLED PROJEKTA. KORISTI OVAJ DOKUMENT DA RAZUMEŠ ŠTA JE URAĐENO I DA POMOGNEŠ KORISNIKU DALJE.**

