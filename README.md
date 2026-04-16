# YO App

Frontend pro YO vault dashboard nasazený jako statický Vite build.

## Stack

- React 18.2.0
- Vite 8.0.8 ✅ (updated April 2026)
- Tailwind CSS 3.4.17
- Radix UI
- RainbowKit 2.2.10 + wagmi 2.19.5 + viem 2.47.6
- @tanstack/react-query 5.96.2
- @yo-protocol/core 1.0.10

## Co appka dělá

- zobrazuje Total Balance
- zobrazuje Profit & Loss
- zobrazuje Claimable Rewards
- umožňuje Deposit / Withdraw
- umožňuje Claim profit a Claim rewards
- používá wallet flow přes RainbowKit

## Lokální vývoj

```bash
npm install
npm run dev
```

Dev server běží standardně na:
- `http://localhost:5173`

## Kontrola kvality

```bash
npm run lint
npm run typecheck
npm run build
```

## Produkční build

```bash
npm run build
```

Build output:
- `dist/`

Na tomto serveru se build kopíruje do:
- `/var/www/tonner`

A servíruje přes nginx pro:
- `tonner.my.id`
- `dev.tonner.my.id`

## Environment proměnné

Používané proměnné:

```env
VITE_APP_ID=yo-app
VITE_API_BASE_URL=http://localhost:3001
VITE_USE_MOCK_AUTH=false
VITE_ENABLE_WALLET_CONNECT=true
```

Poznámky:
- wallet flow dnes běží přes RainbowKit/wagmi
- některé legacy app params zůstávají kvůli kompatibilitě v `src/lib/app-params.js`
- `NODE_ENV` ani `VITE_PORT` není potřeba držet v `.env.local`

## Poznámka ke kódu

Projekt byl iterativně upravovaný, takže část struktury ještě nese historické vrstvy. Aktuálně je ale:
- lint OK
- typecheck OK
- build OK

## Security

- 4 vulnerabilities (2 moderate, 2 critical) - spusť `npm audit fix` pro opravu

## Další doporučené kroky

- sjednotit transaction flow
- pročistit dependencies
- zrevidovat `app-params` legacy vrstvu
