// The build Vercel runs (`npm run build`). Migrations change the LIVE database, so they run only in a
// production build: a preview of an unmerged pull request never touches it. The line printed here is
// what the account test screenshots in the build log.
import { spawnSync } from 'node:child_process'
import { databaseEnvironment } from '../src/lib/databaseEnv.mjs'

const env = process.env.VERCEL_ENV ?? 'local'
let database

function run(command, extraEnv = {}) {
  const result = spawnSync(command, { stdio: 'inherit', shell: true, env: { ...process.env, ...extraEnv } })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function stop(message) {
  console.error(`\nNOT CONFIGURED YET: ${message}\n`)
  process.exit(1)
}

try {
  database = databaseEnvironment(process.env)
} catch (error) {
  stop(error instanceof Error ? error.message : 'database configuration is invalid.')
}

if (env === 'production' || env === 'preview') {
  if (!database.pooledUrl) {
    stop('there is no database. In Vercel: Storage → connect Neon (Postgres) to this project, then Redeploy.')
  }
  if ((process.env.PAYLOAD_SECRET ?? '').length < 32) {
    stop('PAYLOAD_SECRET is missing or shorter than 32 characters. Add it under Settings → Environment Variables, then Redeploy.')
  }
}

if (env === 'production') {
  console.log('MIGRATIONS: running on the production database …')
  // Migrations use Neon's direct (unpooled) connection when Vercel provides one.
  run('npx cross-env NODE_OPTIONS=--no-deprecation payload migrate', {
    DATABASE_URL: database.directUrl || database.pooledUrl,
    STORAGE_URL: database.directUrl || database.pooledUrl,
  })
  console.log('MIGRATIONS: ran')
} else {
  console.log(`MIGRATIONS: skipped (${env === 'preview' ? 'preview' : `VERCEL_ENV=${env}`})`)
}

run('npx cross-env NODE_OPTIONS="--no-deprecation --max-old-space-size=8000" next build')
