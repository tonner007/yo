# YO App

Frontend pro YO vault dashboard nasazený jako statický Vite build.

## Stack

- React 18
- Vite 6
- Tailwind CSS
- Radix UI
- RainbowKit + wagmi + viem
- @tanstack/react-query
- @yo-protocol/core

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

Další doporučené kroky:
- sjednotit transaction flow
- pročistit dependencies
- zrevidovat `app-params` legacy vrstvu
