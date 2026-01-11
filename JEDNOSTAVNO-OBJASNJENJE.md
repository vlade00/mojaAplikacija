# Jednostavno objašnjenje - Korak po korak

## Šta se desilo do sada?

### 1. Pokrenuli smo "virtuelnu bazu podataka"

**Analogija:**
- Zamisli da je baza podataka kao **jedan folder** gde ćeš čuvati podatke
- Umesto da instaliraš program na računar, koristimo **Docker** (kao virtuelnu kutiju)
- Ta kutija (Docker kontejner) **sadrži** bazu podataka unutar sebe

**Šta to znači:**
- ✅ Baza podataka **RADI** (u Docker kutiji)
- ✅ Ne moraš da instaliraš PostgreSQL na računar
- ✅ Sve je u toj "virtuelnoj kutiji"

---

## Šta je baza podataka?

**Jednostavno:**
- Baza podataka = mesto gde čuvaš podatke
- Kao Excel tabela, ali mnogo naprednija

**Primer za naš salon:**
- Tabela sa **klijentima** (ime, email, telefon)
- Tabela sa **rezervacijama** (ko, kada, koji frizer)
- Tabela sa **uslugama** (šišanje, bojenje, cene)

---

## Kako se povezuješ na bazu?

### Način 1: Preko programa (Backend aplikacija) ⭐

**Kada napravimo backend aplikaciju:**
- Backend = program koji "razgovara" sa bazom
- Kaže baz: "Daj mi sve rezervacije"
- Baza mu odgovara: "Evo lista"

**Kako radi:**
```
Backend Program  →  Povezuje se na localhost:5432  →  Baza u Docker kutiji
```

**Šta je localhost:5432?**
- `localhost` = tvoj računar
- `5432` = port (kao vrata kroz koja ulaziš)
- Docker kaže: "Kada neko dođe na port 5432, pošalji ga u moju kutiju"

---

### Način 2: Preko GUI programa (Vizuelni prikaz)

**Šta je GUI?**
- Program sa dugmad, tabelama, vizuelnim prikazom
- Kao Excel, ali za baze podataka

**Primeri programa:**
1. **DBeaver** (besplatno)
   - Instaliraš program
   - Uneseš: localhost, port 5432, username, password
   - Vidiš tabele i podatke

2. **TablePlus** (plaćeno, ali lepo)
   - Isto kao DBeaver

---

## Zašto ne vidiš bazu SADA?

**Trenutno:**
- ✅ Baza **RADI** (u Docker kutiji)
- ❌ Baza je **PRAZNA** (nema tabela)
- ❌ Nema **program** koji se povezuje na nju

**Kao kada imaš prazan folder:**
- Folder postoji ✅
- Ali nema fajlova u njemu ❌

---

## Šta će se desiti dalje?

### Korak 1: Napravićemo Backend program
- Node.js aplikacija
- Povezuje se na bazu
- Kaže bazi: "Kreiraj tabele za klijente, rezervacije, itd."

### Korak 2: Baza će imati tabele
- Tabela: `users` (klijenti)
- Tabela: `appointments` (rezervacije)
- Tabela: `services` (usluge)

### Korak 3: Možeš da koristiš aplikaciju
- Frontend (React) se povezuje na Backend
- Backend se povezuje na Bazu
- Sve radi zajedno!

---

## Primer: Kako će izgledati ceo proces

```
1. Korisnik klikne "Zakaži termin" (u browseru)
   ↓
2. Frontend (React) šalje zahtev Backend-u
   ↓
3. Backend (Node.js) kaže bazi: "Dodaj rezervaciju"
   ↓
4. Baza (PostgreSQL) čuva podatke
   ↓
5. Baza odgovara Backend-u: "Gotovo!"
   ↓
6. Backend odgovara Frontend-u: "Uspešno!"
   ↓
7. Korisnik vidi: "Rezervacija potvrđena!"
```

---

## Šta da zapamtiš?

1. **Docker kontejner = kutija sa bazom podataka**
2. **Baza radi, ali je prazna** (nema tabela još)
3. **Backend program će kreirati tabele** (kada ga napravimo)
4. **Pristup preko localhost:5432** (tvoj računar, port 5432)

---

## Pitaj me ako nešto nije jasno!

Možeš da pitaš:
- "Šta je Docker?"
- "Šta je port?"
- "Kako baza čuva podatke?"
- "Kada ću videti podatke?"

Rado ću objasniti!

