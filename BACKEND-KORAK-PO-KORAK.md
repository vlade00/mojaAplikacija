# Backend Setup - Korak po Korak Objašnjenje

## Šta ćemo raditi?

Napravićemo backend aplikaciju koja će:
1. Slušati zahteve (kao server)
2. Povezivati se na bazu podataka
3. Čuvati podatke (klijenti, rezervacije, itd.)
4. Vraćati podatke frontend-u

---

## KORAK 1: Node.js i npm

**Šta je Node.js?**
- Program koji omogućava da pokrećeš JavaScript KOD VAN browsera
- JavaScript u browseru = frontend
- JavaScript u Node.js = backend

**Šta je npm?**
- Node Package Manager
- Alat za instalaciju biblioteka/paketa (kao što je Express, Prisma, itd.)

**Kako proveriti da li imaš Node.js?**
```bash
node --version
npm --version
```

---

## KORAK 2: package.json

**Šta je package.json?**
- Fajl koji opisuje projekat
- Lista paketa koje koristiš
- Scripts (komande koje možeš pokrenuti)

**Analoija:**
- Kao "recept" za tvoj projekat
- Kaže: "Ovaj projekat koristi Express, Prisma, TypeScript..."

---

## KORAK 3: TypeScript

**Šta je TypeScript?**
- JavaScript sa tipovima
- Lakše za greške (kompajler ti kaže gde grešiš)
- Profesionalniji kod

**Zašto koristimo?**
- Bolje za veće projekte
- Manje grešaka
- Lakše za održavanje

---

## KORAK 4: Express

**Šta je Express?**
- Framework za Node.js
- Omogućava da napraviš API (server)
- Rute (endpoints): `/api/users`, `/api/appointments`

**Primer:**
```javascript
app.get('/api/users', (req, res) => {
  // Vrati sve korisnike
});
```

---

## KORAK 5: Prisma

**Šta je Prisma?**
- ORM (Object-Relational Mapping)
- Omogućava da "razgovaraš" sa bazom podataka bez SQL-a
- Automatski generiše SQL upite

**Zašto?**
- Lakše nego pisanje SQL-a
- Tipovi (TypeScript)
- Migracije (kreiranje tabela)

---

## Struktura projekta (šta ćemo napraviti):

```
gymApp/
├── backend/              ← Backend aplikacija
│   ├── src/             ← Izvorni kod
│   │   ├── index.ts     ← Glavni fajl (startuje server)
│   │   ├── routes/      ← Rute (endpoints)
│   │   ├── controllers/ ← Business logika
│   │   └── prisma/      ← Prisma konfiguracija
│   ├── package.json     ← Dependencies
│   └── tsconfig.json    ← TypeScript konfiguracija
└── frontend/            ← Frontend (napravićemo kasnije)
```

---

## Plan rada:

1. ✅ Kreirati `backend/` folder
2. ✅ Inicijalizovati npm projekat (`npm init`)
3. ✅ Instalirati TypeScript
4. ✅ Instalirati Express
5. ✅ Instalirati Prisma
6. ✅ Kreirati osnovnu strukturu
7. ✅ Napraviti prvi endpoint (test)
8. ✅ Povezati Prisma na bazu
9. ✅ Kreirati prvi model (User)
10. ✅ Napraviti CRUD operacije

---

## Krenimo! 🚀

