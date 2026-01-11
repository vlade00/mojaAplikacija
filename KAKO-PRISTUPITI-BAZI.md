# Kako pristupiti PostgreSQL bazi (bez instalacije PostgreSQL-a)

## Ključna stvar: Docker kontejner IMA PostgreSQL unutar sebe!

Kada pokreneš Docker kontejner, on sadrži **kompletan PostgreSQL server** unutar sebe. Ne moraš da instaliraš PostgreSQL na računar!

---

## Načini pristupa bazi:

### 1. Preko Backend Aplikacije (Glavni način) ⭐

Kada setup-ujemo backend (Node.js + Express + Prisma), aplikacija će se **automatski povezivati** na bazu preko connection string-a:

```
postgresql://postgres:postgres@localhost:5432/hairstudio
```

**Kako radi:**
- Backend aplikacija se povezuje na `localhost:5432`
- Docker mapira port 5432 iz kontejnera na tvoj računar
- Sve radi automatski!

**Primer (kada setup-ujemo Prisma):**
```typescript
// Backend će imati ovakav kod:
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// Automatski se povezuje na bazu!
```

---

### 2. Preko GUI Alata (Vizuelni prikaz)

Moraš instalirati GUI alat, ali **NE PostgreSQL server** (Docker već ima server).

#### Opcija A: DBeaver (Besplatno, preporučeno)
1. Skini sa: https://dbeaver.io/download/
2. Instaliraj (samo DBeaver, ne PostgreSQL server!)
3. Novi Connection → PostgreSQL
4. Unesi:
   - Host: `localhost`
   - Port: `5432`
   - Database: `hairstudio`
   - Username: `postgres`
   - Password: `postgres`

#### Opcija B: pgAdmin (u Dockeru)
Mogu da dodam pgAdmin u docker-compose.yml ako želiš.

#### Opcija C: TablePlus (Plaćeno, ali lepo)
- Skini TablePlus
- Poveži se sa istim podacima kao gore

---

### 3. Preko Docker Exec (Terminal)

Možeš koristiti PostgreSQL komande direktno iz kontejnera:

```bash
# Ulazi u PostgreSQL unutar kontejnera
docker exec -it hairstudio-db psql -U postgres -d hairstudio

# Onda možeš koristiti SQL komande:
# \dt                    - lista tabela
# \d users              - opis tabele users
# SELECT * FROM users;  - SQL upit
# \q                    - izlaz
```

**Primer:**
```bash
# Proveri da li baza radi
docker exec hairstudio-db psql -U postgres -d hairstudio -c "SELECT 1;"
```

---

### 4. Preko Prisma Studio (Kada setup-ujemo Prisma) ⭐

Prisma Studio je GUI koji automatski dolazi sa Prisma ORM-om:

```bash
npx prisma studio
```

Otvara se u browseru na `http://localhost:5555` i vidiš sve tabele i podatke!

---

## Šta sada imaš?

```
┌─────────────────────────────────────┐
│  Tvoj Računar (Windows)             │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Docker Kontejner            │  │
│  │  ┌────────────────────────┐  │  │
│  │  │ PostgreSQL Server      │  │  │
│  │  │ Port: 5432            │  │  │
│  │  │ Database: hairstudio  │  │  │
│  │  └────────────────────────┘  │  │
│  └──────────────────────────────┘  │
│           ↕ (port 5432)            │
│  ┌──────────────────────────────┐  │
│  │  Backend App (Node.js)       │  │
│  │  (kada ga napravimo)         │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Zašto ne moraš instalirati PostgreSQL?

**Docker kontejner JE PostgreSQL server!**

- Kontejner = Izolovan prostor sa svojim operativnim sistemom
- Unutar kontejnera = PostgreSQL server je instaliran
- Port mapping = `5432:5432` znači "port 5432 u kontejneru = port 5432 na tvom računaru"
- Povezivanje = Kada se povezuješ na `localhost:5432`, Docker te preusmerava u kontejner

---

## Pitanje: Da li sada možeš da vidiš bazu?

**Trenutno: NE**, jer:
- Baza je prazna (nema tabele)
- Nema backend aplikacije koja se povezuje
- Nema GUI alat

**Ali možeš da proveriš da radi:**
```bash
docker exec hairstudio-db psql -U postgres -d hairstudio -c "SELECT 1;"
```

Ako vidiš `1`, baza radi! ✅

---

## Šta dalje?

1. Setup backend aplikaciju (Node.js + Prisma)
2. Prisma će kreirati tabele (migracije)
3. Backend će se automatski povezivati na bazu
4. Možeš koristiti Prisma Studio za vizuelni prikaz

**Ili:**
- Instaliraj DBeaver/TablePlus ako želiš odmah videti bazu vizuelno

---

## TL;DR:

- ✅ Docker kontejner **IMA** PostgreSQL server unutar sebe
- ✅ Ne moraš da instaliraš PostgreSQL na računar
- ✅ Pristup preko `localhost:5432`
- ✅ Glavni pristup: Backend aplikacija (kada je napravimo)
- ✅ Alternativa: DBeaver/TablePlus (GUI alati)

