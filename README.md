# MMH

Jordanian digital-code storefront (MMH) plus the Clicks Digitals admin at `/admin`.

This is a full-stack Next.js 16 app with PostgreSQL, Prisma, and Auth.js. The public storefront keeps the approved MMH navy/purple/yellow theme. Admin uses the Clicks Digitals identity only.

## Run locally

```bash
cp .env.example .env
# fill DATABASE_URL, AUTH_SECRET, CODE_ENCRYPTION_KEY, BOOTSTRAP_ADMIN_*
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) and [http://localhost:3001/admin/login](http://localhost:3001/admin/login).

Dev and start scripts are pinned to port **3001**.

Backend setup, roles, storage, backups, and the 1Epin static-IP note: [docs/BACKEND.md](docs/BACKEND.md).

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```
