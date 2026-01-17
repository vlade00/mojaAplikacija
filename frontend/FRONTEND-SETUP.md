# Frontend Setup - Objašnjenje Faze 1

## ✅ Šta smo uradili u Fazi 1

### Korak 1: Kreiranje React Projekta
- ✅ Kreirali React projekat sa TypeScript
- ✅ Instalirane osnovne dependencies

### Korak 2: Instalirane Biblioteke

#### React Router DOM
- ✅ Instaliran `react-router-dom`
- **Za šta služi:** Rutiranje (navigacija između stranica)
- **Primer:** `/login`, `/dashboard`, `/admin`

#### Axios
- ✅ Instaliran `axios`
- **Za šta služi:** HTTP zahtevi ka backend API-ju
- **Primer:** `GET /api/services`, `POST /api/auth/login`

#### TailwindCSS
- ✅ Instaliran `tailwindcss`, `postcss`, `autoprefixer`
- **Za šta služi:** CSS framework za stilizovanje (kao u mockup-u)
- **Primer:** `className="bg-blue-500 text-white rounded-lg"`

---

## 📁 Struktura Projekta (Sada)

```
frontend/
├── public/              # Statički fajlovi (HTML, slike)
│   └── index.html      # Glavni HTML fajl
├── src/                # Izvorni kod
│   ├── App.tsx         # Glavna React komponenta
│   ├── index.tsx       # Entry point
│   └── index.css       # Globalni CSS (sa TailwindCSS)
├── package.json        # Dependencies i scripts
├── tailwind.config.js  # TailwindCSS konfiguracija
└── tsconfig.json       # TypeScript konfiguracija
```

---

## 🎯 Šta sledi - Faza 2

### Autentifikacija
1. Login forma
2. Register forma
3. Čuvanje tokena (localStorage)
4. Redirect prema ulozi

---

## 💡 Objašnjenje - Kako sve funkcioniše zajedno

### 1. React Router (Navigacija)
```typescript
// Primer kako će izgledati
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</BrowserRouter>
```

### 2. Axios (API Pozivi)
```typescript
// Primer kako će izgledati
const response = await axios.post('http://localhost:3000/api/auth/login', {
  email: 'test@example.com',
  password: 'test123'
});
```

### 3. TailwindCSS (Stilizovanje)
```tsx
// Primer kako će izgledati
<button className="bg-indigo-600 text-white rounded-lg px-4 py-2">
  Login
</button>
```

---

## ✅ Rezime Faze 1

**Instalirano:**
- ✅ React Router DOM (navigacija)
- ✅ Axios (API pozivi)
- ✅ TailwindCSS (stilizovanje)

**Kreirano:**
- ✅ `tailwind.config.js` (TailwindCSS konfiguracija)
- ✅ `postcss.config.js` (PostCSS konfiguracija)
- ✅ TailwindCSS direktive u `index.css`

**Spremno za:**
- 🚀 Faza 2: Autentifikacija (Login/Register)

---

**Sledeći korak:** Faza 2 - Autentifikacija! 🎉

