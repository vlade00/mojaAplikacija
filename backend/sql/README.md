# SQL Fajlovi za HairStudio

## Kako koristiti SQL fajlove

### 1. Pokreni seed podatke (popuni bazu)

```bash
# Preko Docker-a:
Get-Content sql/seed-data.sql | docker exec -i hairstudio-db psql -U postgres -d hairstudio

# Ili direktno u DBeaver-u:
# Otvori sql/seed-data.sql i pokreni ga
```

### 2. Korisni SQL upiti

Otvori `sql/queries.sql` - imaš tamo gotove upite za:
- Lista svih frizera
- Lista svih usluga
- Usluge po kategoriji
- Koje usluge radi frizer
- Rezervacije
- Statistika

### 3. Kako da koristiš u DBeaver-u

1. Poveži se na bazu (localhost:5432, hairstudio, postgres/postgres)
2. Otvori SQL Editor
3. Kopiraj SQL upit iz `queries.sql`
4. Pokreni (F5 ili Ctrl+Enter)

### 4. Kako da koristiš u terminalu

```bash
# Jednostavan upit:
docker exec hairstudio-db psql -U postgres -d hairstudio -c 'SELECT * FROM "User";'

# Kompleksniji upit (iz fajla):
Get-Content sql/queries.sql | docker exec -i hairstudio-db psql -U postgres -d hairstudio
```

## Važno

- Uvek koristi **navodnike** oko imena tabela: `"User"`, `"Service"`, itd.
- PostgreSQL je case-sensitive za imena sa navodnicima!




