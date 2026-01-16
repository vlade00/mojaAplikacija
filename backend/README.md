# HairStudio Backend API

Backend API za HairStudio frizerski salon aplikaciju.

## Tech Stack

- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** (preko Docker-a)
- **pg** (PostgreSQL driver - direktno SQL upiti)

## Setup

### 1. Instaliraj dependencies
```bash
npm install
```

### 2. Pokreni Docker bazu
```bash
# U root folderu projekta
docker-compose up -d
```

### 3. Pokreni server
```bash
npm run dev
```

Server će raditi na `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Provera da li server radi

### Services (Usluge)
- `GET /api/services` - Vrati sve usluge
- `GET /api/services/:id` - Vrati jednu uslugu
- `GET /api/services/category/:category` - Vrati usluge po kategoriji

### Stylists (Frizeri)
- `GET /api/stylists` - Vrati sve frizere
- `GET /api/stylists/:id` - Vrati jednog frizera
- `GET /api/stylists/:id/services` - Vrati usluge koje radi frizer

## Baza podataka

- **Host**: localhost
- **Port**: 5432
- **Database**: hairstudio
- **Username**: postgres
- **Password**: postgres

### Tabele:
- `User` - Korisnici (klijenti, frizeri, admin)
- `Stylist` - Frizeri (profil)
- `Service` - Usluge
- `ServiceStylist` - Veza između frizera i usluga
- `Appointment` - Rezervacije
- `Review` - Ocene

## SQL Fajlovi

- `sql/seed-data.sql` - Seed podaci (3 frizera, 24 usluge)
- `sql/queries.sql` - Korisni SQL upiti
- `sql/view-all-data.sql` - Jednostavni upiti za pregled

## Kako koristiti pgAdmin

Vidi `PGADMIN-UPUTSTVO.md` za detaljne instrukcije.

## Struktura projekta

```
backend/
├── src/
│   ├── db/
│   │   └── connection.ts    # Database connection (pg)
│   ├── routes/
│   │   ├── services.ts       # Services endpoints
│   │   └── stylists.ts      # Stylists endpoints
│   └── index.ts              # Main server file
├── sql/
│   ├── seed-data.sql         # Seed podaci
│   ├── queries.sql           # Korisni upiti
│   └── view-all-data.sql     # Pregled podataka
└── package.json
```




