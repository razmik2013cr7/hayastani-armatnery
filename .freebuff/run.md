# Run doc — Հայաստանի Արմատները (React + Vite)

## Reproduce artifacts

1. Install dependencies (lockfile: `package-lock.json`, use npm):
   ```
   npm install
   ```
2. Supabase credentials live in `.env` at the repo root (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). The client (`src/supabaseClient.js`) has the same values as fallbacks, so the app runs even without `.env`. For a fresh checkout, copy `.env` from the main checkout or recreate it.
3. Database schema: run `supabase-schema.sql` once in the Supabase SQL editor (project `xpodpnzdwkmeticzbvvb`) — creates `profiles` + `bookings` with RLS. If the tables already exist from an older version, run `supabase-migration.sql` instead (adds the newer columns + policies; idempotent).

## Run server

```
npm run dev
```

- Default port **5173** (set in `vite.config.js`). If taken, Vite auto-increments — check the "Local:" line in the log output.
- Windows detach recipe (used for the preview):

  ```
  powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
  ```

  stdout and stderr must point at different files.
