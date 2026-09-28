# Account test stand-in

A bare **Next.js + Payload CMS** site on **Postgres (Neon)** and **Vercel Blob**, for the course's
account test (WP1, protocol parts F and H). It is **not** the course starter: it only proves that a
student can take this path on their own free accounts. Nothing here is Campus Cycle content.

It contains: an admin login (`users`), one collection `notes` (a title and an image), one committed
migration, and the route `/api/health`.

## What it proves

| Question | Where to look |
| --- | --- |
| The live database and the image store work | `/api/health` → `"db": "ok"`, `"blob": "ok"` |
| Migrations run **only** in a production build | The build log: `MIGRATIONS: ran` (production) or `MIGRATIONS: skipped (preview)` |
| A stranger cannot create the first admin | `/admin` on a fresh deployment shows a **login** screen, not "Create your first user" |
| Local work uses a development database, not the live one | `dbEndpoint` in `/api/health` differs between `npm run dev` and the live site |

## Deploy it (F1 and F2, in this order)

You need a GitHub account and a Vercel account (Hobby, free). The database and the image store are
created from inside Vercel.

1. On GitHub, **Use this template** → *Create a new repository* in your own account (private is fine).
   Tick **Include all branches**: the branch `add-field` is needed in step 11.
2. On Vercel, **Add New… → Project**, import that repository.
3. On the import screen, under *Environment Variables*, add **before the first deploy**:
   - `PAYLOAD_SECRET`: a random text of **at least 32 characters** (for example from a password manager);
   - `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD`: your admin login.

   Vercel then deploys straight away, and that first build **fails** with
   `NOT CONFIGURED YET: there is no database`. That is expected: carry on with steps 4 and 5.
4. **Storage → Marketplace → Neon (Postgres)**: create a free database and connect it to
   *Production, Preview and Development*. This adds `DATABASE_URL`. **[F1-a]** the consent screen
   and whose account it is; **[F1-b]** the free-plan limits shown.
5. **Storage → Blob**: create a store and connect it. This adds `BLOB_READ_WRITE_TOKEN`.
   **[F1-c]** the environment variable *names* (never the values).
6. **Redeploy** (Deployments → the latest → Redeploy). **[F1-d]** the build log with `MIGRATIONS: ran`
   and the build time.
7. Open `https://<your-site>/api/health`. **[F1-e]** `"db": "ok"`, `"blob": "ok"` and the migration name.

   **Do not open `/admin` yet**: step 8 must be the first visit.
8. In a private window, open `/admin`. **[F2-a]** a login screen, not "Create your first user".
9. Log in at `/admin`, add a note with an image, open the home page. **[F1-f]** the note with its image.

## Previews and migrations (F3)

10. **[F3-a]** Make a second project in the same Neon account (for example a second copy of this site).
11. In GitHub, open a pull request from the branch **`add-field`** (it adds a *summary* field to notes,
    with its migration). Open the preview's build log in Vercel. **[F3-b]** `MIGRATIONS: skipped (preview)`,
    and in Neon the list of branches. **[F3-e]** the preview's home page: it shows an error about the
    missing `summary` column, because previews do not migrate. That is expected evidence, not a fault.
12. Before merging, open the **live** `/api/health`. **[F3-c]** only the first migration is listed.
13. Merge the pull request. When the production build is done: **[F3-d]** its log shows
    `MIGRATIONS: ran`, and the live `/api/health` lists the new migration too.

## Work on your own computer (H)

Node **22** (see `.nvmrc`). No local Postgres. There are two paths; test **H1** first, because it is
the one the course starter will use (it also works for a teammate who cannot reach the owner's Vercel
or Neon accounts).

### H1 · A free Neon database of your own (the starter's path)

1. In **your own** Neon account (neon.com, free), create a new project. Copy its connection string.
2. Copy `.env.example` to `.env.local` and fill in: `DATABASE_URL` (the string from step 1),
   `PAYLOAD_SECRET` (any 32+ characters), `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD`.
3. Run:

   ```bash
   npm install
   npm run migrate
   npm run dev              # http://localhost:3000
   ```

4. `http://localhost:3000/api/health` shows `db: ok`, the migration, and a `dbEndpoint` that is **not**
   the live site's. Log in at `/admin` with the admin from `.env.local`. Record the time the whole of H1
   took.

### H2 · Vercel's Development variables (evidence only)

The Vercel command line keeps **one** signed-in identity per computer. Before `vercel link`, run
`vercel whoami`; if it is not the account that owns this project, `vercel logout`, then `vercel login`
in the right browser profile, and check `vercel whoami` again.

```bash
npm install
npm i -g vercel          # once
vercel link              # choose your project
vercel env pull .env     # writes .env with the Development values; never commit it
npm run dev              # http://localhost:3000
```

**Before anything else**, compare `dbEndpoint` at `http://localhost:3000/api/health` with the live
`/api/health`. They must differ. **If they are the same, your computer is using the live database.**
Stop the dev server, do not run `npm run migrate`, and give Development its own branch:

1. In Neon's console: **Branches → New branch**, name `dev`, parent `main` (production).
2. Open the `dev` branch's **Connect** panel and copy two connection strings: the **pooled** one and the
   **direct** one (pooling off).
3. Point Vercel's *Development* environment at them. This app reads only these two variables:

   | Variable | Value for Development |
   | --- | --- |
   | `DATABASE_URL` | the `dev` branch's **pooled** connection string |
   | `DATABASE_URL_UNPOOLED` | the `dev` branch's **direct** connection string |

   *To verify in the test, record which of these works:* (a) in Vercel, **Settings → Environment
   Variables**, edit both variables for **Development only**; or (b) if Vercel will not let you edit
   variables that the Neon integration manages, reconnect Neon to the project with **Development
   unticked**, then add both variables yourself, scoped to Development.
4. The Neon integration also adds `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`
   and legacy `POSTGRES_*` variables. This app does not read them. If they still point at production
   after step 3, delete those lines from your local `.env`, so no production password sits on your
   computer.
5. `vercel env pull .env` again, start `npm run dev`, and compare `dbEndpoint` once more. Only when it
   differs from the live one: `npm run migrate` brings the `dev` branch up to date.

**Without installing anything:** open the repository in **GitHub Codespaces** (*Code → Codespaces*).
The container has Node 22 and the Vercel CLI; run the same commands from `vercel link` on.

## Changing the model

After changing a collection in `src/collections/`, create its migration and commit it with the change:

```bash
npm run migrate:create -- my-change
```

`npm run build` runs the migrations only when `VERCEL_ENV=production`, over Neon's direct connection
(`DATABASE_URL_UNPOOLED`) when Vercel provides it.

## Safety notes

- The site refuses to start when no admin exists and `FIRST_ADMIN_EMAIL` / `FIRST_ADMIN_PASSWORD` are
  not set, so the "create the first user" screen is never open to strangers.
- `/api/health` shows the database endpoint id (never a password or address). It exists for the
  account test only; the course starter does not expose it.
