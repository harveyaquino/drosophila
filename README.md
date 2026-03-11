# 🪰 DROSOPHILA–7 · Connectome Interface

Conversa con la primera conciencia de mosca de fruta digitalizada del mundo.

Basado en el proyecto real del Howard Hughes Medical Institute y Princeton (2024) que mapeó las 139,255 neuronas de una *Drosophila melanogaster* hembra.

---

## 🚀 Deploy en Vercel (5 minutos)

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/fly-mind.git
git push -u origin main
```

### 2. Conectar Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Click **"Add New Project"**
3. Importa el repo `fly-mind`
4. En **"Environment Variables"** agrega:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (tu API key de Anthropic)
5. Click **Deploy** ✅

### 3. Listo
Vercel te dará una URL pública tipo `fly-mind-xyz.vercel.app`

---

## 💻 Desarrollo local

```bash
npm install
npm run dev
```

> **Nota:** En local, necesitas un servidor para la Edge Function.
> La forma más fácil es hacer deploy a Vercel y usar esa URL directamente.
> O agrega tu API key temporalmente en `api/chat.js` solo para testing local (nunca hagas commit de esto).

---

## 🧠 Cómo funciona

- **Frontend:** React + Vite
- **Backend:** Vercel Edge Function (`/api/chat.js`) que protege tu API key
- **AI:** Claude claude-sonnet-4-20250514 con un system prompt que simula la arquitectura neuronal de la mosca
- **Visualización:** SVG animado con propagación de activación neural inspirada en el connectome real

---

## 📁 Estructura

```
fly-mind/
├── api/
│   └── chat.js          ← Edge Function (API key segura aquí)
├── src/
│   ├── App.jsx          ← App principal
│   └── main.jsx         ← Entry point
├── index.html
├── package.json
└── vite.config.js
```
