# Git - Kratko Objašnjenje

## Kako povezati projekat sa Git-om?

### 1. Instaliraj Git
- Skini sa: https://git-scm.com/download/win
- Instaliraj

### 2. Inicijalizuj Git u projektu
```bash
cd C:\Users\Vlade\Desktop\gymApp
git init
```

### 3. Poveži sa GitHub repozitorijumom
```bash
git remote add origin https://github.com/TVOJ_USERNAME/hairstudio.git
```

### 4. Commit i push
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## Šta je .gitignore?

**Fajl koji kaže Git-u: "Ove fajlove NE commit-uj!"**

**Zašto?**
- `node_modules/` - previše velik (100MB+)
- `.env` - sadrži lozinke (OPASNO!)
- `dist/` - build fajlovi (može se regenerisati)

**Šta TREBA commit-ovati:**
- ✅ Source kod (`.ts`, `.js` fajlovi)
- ✅ `package.json` (ali NE `node_modules/`)
- ✅ Konfiguracije (`tsconfig.json`, `docker-compose.yml`)

**Šta NE TREBA commit-ovati:**
- ❌ `node_modules/` (instalira se sa `npm install`)
- ❌ `.env` (lozinke - OPASNO!)
- ❌ `dist/` (build output)

---

## TL;DR

1. `git init` - kreira Git repozitorijum
2. `git add .` - dodaje fajlove
3. `git commit -m "poruka"` - čuva promene
4. `git push` - šalje na GitHub

`.gitignore` = lista fajlova koje Git ignorira

