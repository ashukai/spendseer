# Budgeta — Deploy Guide

## 1. Supabase project

1. Go to https://supabase.com → **New project**.
2. Choose a name, region, and password. Wait for provisioning (~1 min).
3. In the sidebar: **SQL editor** → paste the contents of `supabase/schema.sql` → **Run**.
4. **Turn off email confirmation** (so users sign in immediately after signup):
   - Sidebar → **Authentication** → **Providers** → **Email**
   - Disable **Confirm email** → Save.
5. Copy your keys:
   - Sidebar → **Project Settings** → **API**
   - Copy **Project URL** and **anon / public** key.

---

## 2. Local development

```bash
# In the project folder:
cp .env.example .env.local
# Edit .env.local and fill in:
#   VITE_SUPABASE_URL=https://xxxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJh...

npm install
npm run dev
```

Open http://localhost:5173 — create an account and you're in.

---

## 3. Deploy to Cloudflare Pages

### First deploy

1. Push your code to a GitHub (or GitLab) repo.
2. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select your repo.
4. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. **Environment variables** (under Settings → Environment variables):
   ```
   VITE_SUPABASE_URL      = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJh...
   ```
   Add these for both **Production** and **Preview**.
6. Click **Save and Deploy**. Cloudflare builds and gives you a `*.pages.dev` URL.

### SPA routing fix (required)

React Router uses client-side routing, so deep links like `/settings` 404 on a hard refresh without this fix.

Create a file at `public/_redirects`:
```
/*  /index.html  200
```

This file is already committed in this repo — Cloudflare Pages picks it up automatically.

### Subsequent deploys

Push to `main` → Cloudflare Pages auto-builds and deploys. Done.

---

## 4. Custom domain (optional)

In Cloudflare Pages → your project → **Custom domains** → **Set up a custom domain**.
If your domain is already on Cloudflare DNS, it wires up in seconds.

---

## 5. Checklist before going live

- [ ] Schema applied in Supabase SQL editor
- [ ] Email confirmation disabled in Supabase Auth settings
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set in Cloudflare Pages env vars
- [ ] `public/_redirects` file present (SPA routing)
- [ ] Test sign-up → add expense → check home screen on mobile
