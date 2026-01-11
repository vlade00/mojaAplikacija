# Objašnjenje Docker Setup-a za HairStudio

## Šta je Docker i zašto ga koristimo?

**Docker** je alat koji omogućava da pokrenemo aplikacije u "kontejnerima" - kao virtuelne mašine, ali mnogo lakše.

**Zašto koristimo Docker za PostgreSQL?**
- ✅ Ne moraš da instaliraš PostgreSQL na računar (nema instalacije od 200MB+)
- ✅ Sve radi u izolovanom kontejneru (ne zagaduje tvoj sistem)
- ✅ Lako za brisanje - samo `docker-compose down`
- ✅ Isti kod radi svuda (Windows, Mac, Linux)

---

## Objašnjenje docker-compose.yml fajla

### 1. `version: '3.8'`
- To je verzija Docker Compose formata (stari format, ali radi)
- **Napomena**: Noviji Docker ne zahteva ovu liniju, ali ne škodi

### 2. `services:` sekcija
Definiše koje servise (kontejnere) želimo da pokrenemo.

#### `postgres:` - naziv servisa
```yaml
image: postgres:15-alpine
```
- **Šta radi**: Skida PostgreSQL 15 verziju sa Docker Hub-a
- **Alpine**: Manja verzija (50MB umesto 300MB), brža
- **15**: verzija PostgreSQL-a

#### `container_name: hairstudio-db`
- Ime kontejnera - lakše za identifikaciju
- Možeš videti u `docker ps`

#### `environment:` - environment varijable
```yaml
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres
POSTGRES_DB: hairstudio
```
- **POSTGRES_USER**: Username za bazu podataka
- **POSTGRES_PASSWORD**: Lozinka za bazu
- **POSTGRES_DB**: Ime baze podataka koja se automatski kreira

**⚠️ VAŽNO**: U produkciji NIKAD ne stavljaj lozinke ovako! Koristi `.env` fajl!

#### `ports:` - port mapping
```yaml
- "5432:5432"
```
- **Šta znači**: Mapira port 5432 iz kontejnera na port 5432 tvog računara
- **Zašto**: Da možeš da se povežeš sa baze sa tvog računara
- Format: `"HOST:CONTAINER"`

#### `volumes:` - perzistentnost podataka
```yaml
postgres_data:/var/lib/postgresql/data
```
- **Šta radi**: Čuva podatke iz baze u Docker volume-u
- **Zašto**: Kada zaustaviš kontejner, podaci ne nestaju
- `postgres_data` je ime volume-a (definisano na dnu fajla)

#### `healthcheck:`
- Docker proverava da li je baza spremna
- Ako ne radi, Docker će je restartovati
- `pg_isready` - PostgreSQL komanda koja proverava status

---

## Šta se desilo kada si pokrenuo `docker-compose up -d`?

1. **Docker je skinuo** PostgreSQL image (prvi put traje dugo, sledeći put je brzo)
2. **Kreirao je kontejner** sa svim postavkama iz fajla
3. **Pokrenuo je PostgreSQL** server unutar kontejnera
4. **Kreirao je bazu podataka** `hairstudio` automatski
5. **`-d` flag**: "detached mode" - radi u pozadini, ne blokira terminal

---

## Kako se povezuješ na bazu?

**Connection string:**
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

U našem slučaju:
```
postgresql://postgres:postgres@localhost:5432/hairstudio
```

**Objašnjenje:**
- `postgres:postgres` - username:password
- `localhost:5432` - gde se baza nalazi (tvoj računar, port 5432)
- `hairstudio` - ime baze

---

## Korisne Docker komande

### `docker-compose up -d`
- Pokreće sve servise iz docker-compose.yml
- `-d` = u pozadini (detached)

### `docker-compose down`
- Zaustavlja i briše kontejnere
- ⚠️ **NE briše podatke** (volume ostaje)

### `docker-compose down -v`
- Zaustavlja kontejnere I briše podatke (volume)
- ⚠️ **OPASNO** - gubiš sve podatke!

### `docker-compose ps`
- Prikazuje status kontejnera
- Vidiš da li radi (STATUS: Up/healthy)

### `docker-compose logs`
- Prikazuje logove (šta se dešava u kontejneru)
- `docker-compose logs -f` = prati logove u realnom vremenu

---

## Šta dalje?

Sada imaš bazu podataka koja radi. Sledeći korak je da:
1. Setup-uješ backend (Node.js + Express)
2. Setup-uješ Prisma ORM (koji će se povezati na ovu bazu)
3. Definišeš šemu (models) - User, Appointment, Service, itd.
4. Pokreneš migracije - Prisma će automatski kreirati tabele u bazi

---

## Zašto je ovo bolje nego instalirati PostgreSQL?

| Instalacija PostgreSQL | Docker |
|------------------------|--------|
| 200MB+ instalacija | Nema instalacije |
| Komplikovano brisanje | `docker-compose down` |
| Može da pravi probleme sa drugim verzijama | Izolovano, bezbedno |
| Različito radi na Windows/Mac/Linux | Isto radi svuda |

