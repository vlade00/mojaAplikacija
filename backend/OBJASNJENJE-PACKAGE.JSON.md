# Objašnjenje package.json

## Šta je package.json?

**package.json** = "Recept" za tvoj projekat. Kaže npm-u:
- Koje pakete (biblioteke) projekat koristi
- Kako pokrenuti projekat
- Informacije o projektu

---

## Šta znači svako polje?

### `"name": "backend"`
- Ime projekta
- Možeš promeniti (npr. "hairstudio-backend")

### `"version": "1.0.0"`
- Verzija projekta
- Format: MAJOR.MINOR.PATCH (npr. 1.0.0, 1.1.0, 2.0.0)

### `"main": "index.js"`
- Glavni fajl koji se pokreće
- Kasnije ćemo promeniti u "dist/index.js" (TypeScript kompajluje u dist/)

### `"scripts": {}`
- Komande koje možeš pokrenuti
- Primer: `npm run start` → pokreće server

### `"dependencies": {}`
- **Paketi koje projekat koristi u produkciji**
- Npr: Express, Prisma
- Ovo će se pojaviti kada instaliramo pakete

### `"devDependencies": {}`
- **Paketi samo za development** (ne idu u produkciju)
- Npr: TypeScript, nodemon (auto-restart servera)
- Ovo će se pojaviti kada instaliramo dev pakete

---

## Šta ćemo dodati?

1. **Dependencies** (produkcija):
   - `express` - Web framework
   - `@prisma/client` - Prisma client za bazu
   - `cors` - Omogućava frontend da pristupa API-ju
   - `dotenv` - Čita .env fajl (lozinke, itd.)

2. **DevDependencies** (development):
   - `typescript` - TypeScript kompajler
   - `@types/node` - TypeScript tipovi za Node.js
   - `@types/express` - TypeScript tipovi za Express
   - `ts-node-dev` - Pokreće TypeScript fajlove direktno
   - `prisma` - Prisma CLI (komande)

---

## Sledeći korak:

Instaliraćemo ove pakete sa:
```bash
npm install express @prisma/client cors dotenv
npm install -D typescript @types/node @types/express ts-node-dev prisma
```

**Šta znači:**
- `npm install` = instalira u dependencies
- `npm install -D` = instalira u devDependencies (-D = --save-dev)

