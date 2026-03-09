# Deploy Checklist (Vercel + Neon)

## 1. Prepare Services
- Create a Neon Postgres project and copy `DATABASE_URL`.
- Create a Clerk application and copy:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`

## 2. Configure Clerk
- Add allowed origins/redirects for local development:
  - `http://localhost:3000`
- Add allowed origins/redirects for production:
  - `https://<your-vercel-domain>`

## 3. Configure Environment Variables
In Vercel project settings, add:
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## 4. Database Migration
Run migrations in CI/CD or manually before first production run:

```bash
npx prisma migrate deploy
```

## 5. Build + Smoke Test
- Run `npm run lint`
- Run `npm run build`
- Deploy on Vercel
- Verify:
  - Sign in and sign out
  - Dashboard loads only your workspaces
  - Create workspace and join by invite code
  - Create/update applications
  - List/Board switch, status filter, and search (`q`) work

## 6. Post-Deploy Notes
- If legacy workspaces are missing memberships, load `/dashboard` once while signed in to trigger the backfill logic.
- Remove transitional backfill later after all existing data is normalized.
