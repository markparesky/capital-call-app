# Kids Spending Tracker

A simple accountability app: the kids log what they buy on the shared credit card,
the app auto-categorizes it (Food, Shopping, Rides, …), and you get a dashboard and
CSV export sortable by child and category. Visibility only — no controls.

## How it works

- **Each kid gets a private link** (`/k/<their-token>`) — no account, no password.
  They add it to their iPhone Home Screen and logging a purchase takes 5 seconds:
  amount + store name. The category is guessed automatically and can be fixed with one tap.
- **Apple Pay logs itself**: each kid's page links to a one-time setup guide
  (`/k/<their-token>/setup`) that walks them through creating an iOS Shortcuts
  **Transaction automation**. After that, every tap-to-pay purchase posts the merchant
  and amount to the app automatically.
- **Parent dashboard** at `/parent` (password-protected): totals by child and category,
  filters, a sortable table, inline category corrections, and **Export CSV**.

## Deploy (Railway)

1. New project → Deploy from this GitHub repo.
2. Add a **PostgreSQL** database to the project.
3. Set environment variables on the app service:
   - `DATABASE_URL` — reference the Postgres plugin's URL
   - `PARENT_PASSWORD` — the password for the parent dashboard
   - `ANTHROPIC_API_KEY` — (optional) enables 📷 receipt/screenshot scanning,
     from [console.anthropic.com](https://console.anthropic.com) → API Keys
4. Deploy. The build runs `prisma db push`, which creates the tables automatically.

Works the same on any host that runs Next.js + Postgres (Render, Fly, Vercel + Neon).

## Local development

```bash
npm install
DATABASE_URL=postgresql://... PARENT_PASSWORD=something npx prisma db push
DATABASE_URL=postgresql://... PARENT_PASSWORD=something npm run dev
```

## First-time setup after deploy

1. Open `/parent`, sign in, and add each child under **Manage Kids**.
2. Text each kid their personal link (Copy their link).
3. Have them tap the ⚡ link on their page to set up Apple Pay auto-logging.
