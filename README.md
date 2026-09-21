# Private Android Cloud — web client

Vite + React dashboard. **No user files** are stored here. It talks only to the
control plane at `https://cloud.digitalproductsolutions.in`.

## Local

```bash
npm install
npm run dev
```

## Vercel

1. Import this GitHub repo (`Adarsh-oo7/serverfrontend`).
2. Framework: Vite.
3. Environment variable:

```
VITE_API_URL=https://cloud.digitalproductsolutions.in
```

4. Deploy.

The VPS control plane already allows browser CORS (Authorization header).
File bytes still come from Android devices, not from Vercel or the VPS.

