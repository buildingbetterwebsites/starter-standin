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

## Deploy it (F1, in this order)

You need a GitHub account and a Vercel account (Hobby, free). The database and the image store are
created from inside Vercel.

1. On GitHub, **Use this template** → *Create a new repository* in your own account (private is fine).
2. On Vercel, **Add New… → Project**, import that repository. **Do not deploy yet.**
3. Under *Environment Variables*, add **before the first deploy**:
   - `PAYLOAD_SECRET`: a long random text (for example from a password manager);
   - `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD`: your admin login.
4. **Storage → Marketplace → Neon (Postgres)**: create a free database and connect it to
   *Production, Preview and Development*. This adds `DATABASE_URL`. **[F1-a]** the consent screen
   and whose account it is; **[F1-b]** the free-plan limits shown.
5. **Storage → Blob**: create a store and connect it. This adds `BLOB_READ_WRITE_TOKEN`.
   **[F1-c]** the environment variable *names* (never the values).
6. **Deploy.** **[F1-d]** the build log with `MIGRATIONS: ran` and the build time.
7. Open `https://<your-site>/api/health`. **[F1-e]** `"db": "ok"`, `"blob": "ok"` and the migration name.
8. Log in at `/admin`, add a note with an image, open the home page. **[F1-f]** the note with its image.
9. In a private window, open `/admin`. **[F2-a]** a login screen, not "Create your first user".

## Previews and migrations (F3)

10. **[F3-a]** Make a second project in the same Neon account (for example a second copy of this site).
11. In GitHub, open a pull request from the branch **`add-field`** (it adds a *summary* field to notes,
    with its migration). Open the preview's build log in Vercel. **[F3-b]** `MIGRATIONS: skipped (preview)`,
    and in Neon the list of branches.
12. Before merging, open the **live** `/api/health`. **[F3-c]** only the first migration is listed.
13. Merge the pull request. When the production build is done: **[F3-d]** its log shows
    `MIGRATIONS: ran`, and the live `/api/health` lists the new migration too.

## Work on your own computer (H)

Node **22** (see `.nvmrc`). No local Postgres: your database is a Neon **development branch**.

```bash
npm install
npm i -g vercel          # once
vercel link              # choose your project
vercel env pull .env     # writes .env with the Development values; never commit it
npm run migrate          # brings your development branch up to date
npm run dev              # http://localhost:3000
```

Compare `dbEndpoint` at `http://localhost:3000/api/health` with the live `/api/health`: they must differ.

**Without installing anything:** open the repository in **GitHub Codespaces** (*Code → Codespaces*).
The container has Node 22 and the Vercel CLI; run the same commands from `vercel link` on.

## Changing the model

After changing a collection in `src/collections/`, create its migration and commit it with the change:

```bash
npm run migrate:create -- my-change
```

`npm run build` runs the migrations only when `VERCEL_ENV=production`.
