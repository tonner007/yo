# YO App - DeFi Dashboard

Moderní React aplikace pro DeFi dashboard s wallet integration.

## 🚀 Rychlý start

1. **Instalace závislostí:**
   ```bash
   npm install
   ```

2. **Spuštění vývojového serveru:**
   ```bash
   npm run dev
   ```

3. **Otevřít v prohlížeči:**
   - Aplikace běží na [http://localhost:5173](http://localhost:5173)

## 📁 Projektová struktura

```
yo-app/
├── src/
│   ├── api/              # API klienti a služby
│   ├── components/       # React komponenty
│   │   ├── defi/        # DeFi specifické komponenty
│   │   └── ui/          # UI komponenty (Radix UI)
│   ├── lib/             # Utility funkce a kontexty
│   ├── pages/           # Stránky aplikace
│   └── main.jsx         # Vstupní bod aplikace
├── public/              # Statické soubory
└── index.html           # Hlavní HTML soubor
```

## 🛠️ Technologie

- **React 18** - UI knihovna
- **Vite** - Build tool a dev server
- **TypeScript** - Typový systém
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Přístupné UI komponenty
- **React Router** - Client-side routing
- **React Query** - Data fetching a caching

## 🔧 Konfigurace

Vytvořte `.env.local` soubor pro environment proměnné:

```env
# Základní konfigurace
VITE_APP_ID=yo-app
VITE_API_BASE_URL=http://localhost:3001

# Feature flags
VITE_USE_MOCK_AUTH=true
VITE_ENABLE_WALLET_CONNECT=false
```

## 🚀 Build pro produkci

```bash
# Build aplikace
npm run build

# Preview build
npm run preview
```

## 📦 Nasazení

Aplikaci lze nasadit na:
- **Vercel** - `vercel deploy`
- **Netlify** - `netlify deploy`
- **GitHub Pages** - `npm run build && gh-pages -d dist`
- **Jakýkoliv statický hosting**

## 🎯 Funkce

- ✅ DeFi dashboard s TVL displayem
- ✅ Wallet connection button
- ✅ Mock autentizace
- ✅ Responsive design
- ✅ Moderní UI s Tailwind CSS
- ✅ Přístupné komponenty (Radix UI)

## 🔄 Plánované funkce

- [ ] Integrace ConnectKit/Wagmi
- [ ] Reálná wallet connection
- [ ] USDC balance display
- [ ] Multi-chain support
- [ ] Reálná API integrace

## 📄 Licence

MIT
