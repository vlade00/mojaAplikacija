# Docker - Jednostavno Objašnjenje

## 🎯 Šta je Docker?

**Jednostavno:**
- Docker = **virtuelna kutija** (kontejner) koja sadrži program
- Umesto da instaliraš PostgreSQL na računar, Docker ga "pakuje" u kutiju
- Ta kutija radi nezavisno od tvog sistema

**Analogija:**
- Kao da imaš **virtuelni računar unutar tvog računara**
- Taj virtuelni računar ima samo bazu podataka
- Ne utiče na tvoj glavni računar

---

## 📍 Gde se koristi u našem projektu?

**Samo za bazu podataka!**

```
Tvoj Računar
  ├── HairStudio Projekat (tvoj kod)
  └── Docker Kontejner
      └── PostgreSQL Baza (hairstudio)
```

**Zašto?**
- ✅ Ne moraš da instaliraš PostgreSQL na računar
- ✅ Lako se pokreće i zaustavlja
- ✅ Ne zagaduje sistem
- ✅ Ista baza radi na svim računarima

---

## 🔧 Kako funkcioniše?

### 1. Fajl: `docker-compose.yml`

**Gde je?** U root folderu projekta (`hairStudioApp/docker-compose.yml`)

**Šta radi?**
- Kaže Docker-u: "Kreiraj kontejner sa PostgreSQL bazom"
- Definiše:
  - Ime kontejnera: `hairstudio-db`
  - Port: `5434` (spoljašnji) → `5432` (unutrašnji)
  - Username: `postgres`
  - Password: `postgres`
  - Database: `hairstudio`

**Primer:**
```yaml
services:
  postgres:
    container_name: hairstudio-db  # Ime kontejnera
    ports:
      - "5434:5432"  # Spoljašnji port:Unutrašnji port
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hairstudio
```

---

## 🚀 Osnovne komande

### Pokreni bazu
```bash
docker-compose up -d
```
**Šta radi?**
- Kreira i pokreće Docker kontejner
- `-d` = radi u pozadini (detached mode)

### Zaustavi bazu
```bash
docker-compose down
```
**Šta radi?**
- Zaustavlja i briše kontejner
- **Podaci se NE brišu** (čuvaju se u volumenu)

### Proveri da li radi
```bash
docker ps
```
**Šta radi?**
- Prikazuje sve pokrenute kontejnere
- Treba da vidiš `hairstudio-db`

### Vidi logove
```bash
docker logs hairstudio-db
```
**Šta radi?**
- Prikazuje šta se dešava u kontejneru

---

## 🔌 Kako se povezuješ na bazu?

### Iz Backend-a (Node.js)

**Fajl:** `backend/.env`
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/hairstudio
```

**Objašnjenje:**
- `postgresql://` = protokol
- `postgres:postgres` = username:password
- `@localhost:5434` = gde se baza nalazi (tvoj računar, port 5434)
- `/hairstudio` = ime baze

**Kako radi?**
```
Backend Program
  ↓
Povezuje se na localhost:5434
  ↓
Docker prima zahtev
  ↓
Prosleđuje ga u kontejner (port 5432)
  ↓
PostgreSQL baza
```

### Iz pgAdmin-a

**Connection Settings:**
- Host: `localhost`
- Port: `5434` (spoljašnji port)
- Database: `hairstudio`
- Username: `postgres`
- Password: `postgres`

---

## 📊 Gde su podaci?

**Docker Volume:**
- Podaci se čuvaju u Docker volumenu
- Ime: `hairstudioapp_postgres_data`
- Lokacija: Docker interno upravlja (ne moraš da znaš gde)

**Važno:**
- Kada obrišeš kontejner (`docker-compose down`), podaci ostaju
- Kada obrišeš volume, podaci se brišu

---

## 🎯 Šta se dešava kada pokreneš `docker-compose up -d`?

1. **Docker čita** `docker-compose.yml`
2. **Preuzima** PostgreSQL sliku (ako nije već preuzeta)
3. **Kreira** kontejner sa imenom `hairstudio-db`
4. **Pokreće** PostgreSQL unutar kontejnera
5. **Kreira** bazu `hairstudio`
6. **Otvara** port `5434` na tvom računaru
7. **Čeka** zahteve na tom portu

---

## 🔄 Ciklus rada

### Prvi put:
```bash
1. docker-compose up -d    # Kreira i pokreće kontejner
2. Kreiraj tabele (SQL)     # backend/sql/create-tables.sql
3. Ubaci podatke (SQL)      # backend/sql/seed-data.sql
4. Poveži se (pgAdmin)      # Vidi podatke
```

### Svaki sledeći put:
```bash
1. docker-compose up -d     # Pokreće postojeći kontejner
2. Poveži se (pgAdmin)      # Vidi podatke (sve je tu!)
```

### Kada završiš rad:
```bash
docker-compose down         # Zaustavi kontejner (podaci ostaju)
```

---

## ❓ Često pitanja

### Q: Zašto port 5434, a ne 5432?
**A:** Možda imaš lokalni PostgreSQL na portu 5432. Port 5434 izbegava konflikt.

### Q: Gde su podaci kada obrišem kontejner?
**A:** U Docker volumenu. Podaci se ne brišu automatski.

### Q: Kako da obrišem sve (i podatke)?
**A:** 
```bash
docker-compose down -v    # -v = briše i volume (podatke)
```

### Q: Zašto ne vidim bazu u pgAdmin-u?
**A:** 
- Proveri da li je kontejner pokrenut: `docker ps`
- Proveri port (5434, ne 5432)
- Proveri lozinku (postgres)

### Q: Kako da vidim šta je u bazi?
**A:**
- pgAdmin (vizuelno)
- DBeaver (vizuelno)
- SQL upiti preko `docker exec` komande

---

## 📝 Rezime

**Docker u našem projektu:**
1. ✅ **Samo za bazu podataka** (PostgreSQL)
2. ✅ **Pokrećeš sa:** `docker-compose up -d`
3. ✅ **Zaustavljaš sa:** `docker-compose down`
4. ✅ **Povezuješ se na:** `localhost:5434`
5. ✅ **Podaci se čuvaju** u Docker volumenu

**Ne koristi se za:**
- ❌ Backend kod (to je običan Node.js)
- ❌ Frontend kod (to je običan React)
- ❌ Bilo šta drugo osim baze

---

## 🎓 Za master rad

**Kako ovo pokriva predmete:**

1. **Napredne baze podataka:**
   - ✅ PostgreSQL (relaciona baza)
   - ✅ SQL upiti
   - ✅ Tabele, relacije, indeksi

2. **Alati i okruženja:**
   - ✅ Docker (kontejnerizacija)
   - ✅ docker-compose (orchestration)
   - ✅ Environment variables (.env)

3. **Softverske arhitekture:**
   - ✅ Separation of concerns (baza odvojeno od aplikacije)
   - ✅ Containerization pattern

---

**Pitanja? Pitaj!** 🚀

