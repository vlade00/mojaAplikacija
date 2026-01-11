# HairStudio - Setup Instrukcije

## 1. Pokreni PostgreSQL Bazu (Docker)

```bash
docker-compose up -d
```

Ovo će pokrenuti PostgreSQL na portu 5432 sa:
- Username: `postgres`
- Password: `postgres`
- Database: `hairstudio`

Proveri da li radi:
```bash
docker-compose ps
```

Zaustavi bazu:
```bash
docker-compose down
```

## 2. Connection String

Kada pokreneš bazu, connection string će biti:
```
postgresql://postgres:postgres@localhost:5432/hairstudio
```

## 3. Sledeći koraci

1. Setup backend (Node.js + Express + TypeScript)
2. Setup Prisma ORM
3. Definiši database schema
4. Pokreni migracije
5. Setup frontend (React)

