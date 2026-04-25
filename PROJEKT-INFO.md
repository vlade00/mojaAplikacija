# HairStudio - Informacije o Projektu

## 📋 Opis Projekta

**HairStudio** je full-stack web aplikacija za upravljanje frizerskim salonom.

## 🛠️ Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + TailwindCSS
- **Database**: PostgreSQL 15 (Docker)
- **Database Driver**: `pg` (direktni SQL upiti, bez ORM-a)
- **Authentication**: JWT (JSON Web Tokens)
- **Version Control**: Git + GitHub Desktop

## 📁 Struktura Projekta

```
hairStudioApp/
├── backend/              # Backend API
│   ├── src/
│   │   ├── db/           # Database connection (connection pooling)
│   │   ├── routes/       # API endpoints (auth, appointments, services, admin, stylist, reviews)
│   │   ├── middleware/   # Auth middleware, file upload
│   │   └── index.ts      # Express server
│   ├── sql/
│   │   ├── create-tables.sql  # Struktura baze (6 tabela, 8 indeksa)
│   │   └── seed-data.sql      # Test podaci (3 frizera, 24 usluge)
│   └── package.json
│
├── frontend/             # React aplikacija
│   ├── src/
│   │   ├── components/   # React komponente (Login, Register, CustomerDashboard, AdminDashboard, StylistPanel, Booking)
│   │   ├── services/     # API servisi (authService, appointmentService, itd.)
│   │   ├── context/      # AuthContext (global state)
│   │   └── types/        # TypeScript tipovi
│   └── package.json
│
└── docker-compose.yml    # Docker konfiguracija za PostgreSQL
```

## 🗄️ Baza Podataka

### Pristup:
- **Host**: `localhost`
- **Port**: `5434` (Docker mapping: 5434:5432)
- **Database**: `hairstudio`
- **Username**: `postgres`
- **Password**: `postgres`

### Tabele (6 tabela):
1. **User** - Korisnici (CUSTOMER, STYLIST, ADMIN)
2. **Stylist** - Profil frizera (rating, bio, iskustvo)
3. **Service** - Usluge (sisanje, brada, farbanje, nega)
4. **ServiceStylist** - Many-to-many veza (koji frizer radi koju uslugu)
5. **Appointment** - Rezervacije termina
6. **Review** - Ocene frizera (1-5 zvezdica)

### Indeksi (8 indeksa):
- `idx_user_email` - Brza pretraga po email-u
- `idx_user_role` - Filtriranje po ulozi
- `idx_appointment_date` - Brza pretraga po datumu
- `idx_appointment_customer` - Rezervacije korisnika
- `idx_appointment_stylist` - Rezervacije frizera
- `idx_review_stylist` - Ocene frizera
- itd.

**SQL fajl sa strukturom**: `backend/sql/create-tables.sql`

## 🚀 Kako Pokrenuti

### 1. Pokreni Docker bazu
```bash
# U root folderu projekta
docker-compose up -d
```

### 2. Pokreni Backend
```bash
cd backend
npm install
npm run dev
```
Backend radi na: `http://localhost:3000`

### 3. Pokreni Frontend
```bash
cd frontend
npm install
npm start
```
Frontend radi na: `http://localhost:3005`

## 🔐 API Endpoints (Postman primeri)

### 1. Javni Endpoint (bez autentifikacije)
```
GET http://localhost:3000/api/services
```

### 2. Login (dobija JWT token)
```
POST http://localhost:3000/api/auth/login
Body (JSON):
{
  "email": "test@example.com",
  "password": "test123"
}
Response: { "user": {...}, "token": "eyJhbGci..." }
```

### 3. Zaštićeni Endpoint (sa JWT tokenom)
```
GET http://localhost:3000/api/appointments
Headers:
  Authorization: Bearer [TOKEN_IZ_LOGINA]
```

## 👥 Korisničke Uloge

- **CUSTOMER** - Klijent (može da rezerviše termin, oceni frizera)
- **STYLIST** - Frizer (vidi svoje rezervacije, ocene)
- **ADMIN** - Administrator (upravljanje korisnicima, frizerima, rezervacijama)

## 📝 Funkcionalnosti

### Customer Dashboard:
- Pregled usluga i frizera
- Rezervisanje termina
- Pregled svojih rezervacija
- Ocenjivanje frizera
- Profil (izmena podataka, promena lozinke, avatar)

### Admin Dashboard:
- Upravljanje korisnicima (CRUD)
- Upravljanje frizerima (CRUD)
- Pregled svih rezervacija
- Dodela usluga frizerima

### Stylist Panel:
- Pregled svojih rezervacija
- Statistika (ukupno, danas, završeno)
- Pregled ocena i komentara

## 🔧 Važne Komande

```bash
# Docker
docker-compose up -d          # Pokreni bazu
docker-compose down           # Zaustavi bazu
docker-compose ps             # Status

# Backend
npm run dev                   # Development mode
npm run build                 # Build (TypeScript → JavaScript)
npm start                     # Production mode

# Frontend
npm start                     # Development server
npm run build                 # Production build
```

## 📦 Environment Variables

### Backend (`backend/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/hairstudio
PORT=3000
JWT_SECRET=your-super-secret-key-change-this-in-production
```

### Frontend (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:3000/api
```

## 🎯 Arhitektura

**3-Tier Architecture:**
1. **Presentation Layer** - React frontend
2. **Business Logic Layer** - Express backend
3. **Data Layer** - PostgreSQL database

**Patterns:**
- RESTful API
- JWT Authentication
- Role-based Authorization
- Connection Pooling (PostgreSQL)
- Service Layer Pattern (Frontend)

## 📚 Master's Predmeti

Projekat pokriva:
- **Napredne baze podataka** - PostgreSQL, indeksi, JOIN upiti, subqueries
- **Alati i okruženja** - Docker, Git, VS Code, Postman, pgAdmin
- **Napredne softverske arhitekture** - 3-tier, RESTful API, JWT
- **Proces i metodologije** - Git workflow, development proces

## ⚠️ Važno

- **Prisma je uklonjen** - koristimo direktne SQL upite preko `pg` driver-a
- **Docker port**: 5434 (ne 5432) - zbog lokalnog PostgreSQL-a
- **JWT token** se dobija preko `/api/auth/login` i koristi u `Authorization: Bearer [token]` header-u

## 📞 Pristup Bazi

**pgAdmin / DBeaver:**
- Host: `localhost`
- Port: `5434`
- Database: `hairstudio`
- Username: `postgres`
- Password: `postgres`

---

**Napomena**: Sve informacije su sačuvane u ovom fajlu. Git commit i push će sačuvati sve fajlove na GitHub-u.

