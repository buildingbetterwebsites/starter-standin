import configPromise from '@payload-config'
import { list } from '@vercel/blob'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { databaseEnvironment } from '../../../lib/databaseEnv.mjs'

// Evidence for the account test: which database and store this deployment uses, and which migrations
// have run. It never returns a password, a token or the full database address.
export const dynamic = 'force-dynamic'

/** Neon's endpoint id (`ep-…`) from the database host, so local and live can be compared without secrets. */
function databaseEndpoint(): string {
  try {
    const host = new URL(databaseEnvironment(process.env).pooledUrl).hostname
    const first = host.split('.')[0] ?? ''
    return first.startsWith('ep-') ? first.replace(/-pooler$/, '') : `not Neon (${host || 'no database URL'})`
  } catch {
    return 'unreadable database URL'
  }
}

export async function GET() {
  const report: Record<string, unknown> = {
    env: process.env.VERCEL_ENV ?? 'local',
    dbEndpoint: databaseEndpoint(),
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.db.drizzle.execute(sql`select name from payload_migrations order by id`)
    report.db = 'ok'
    report.migrations = (result.rows as { name: string }[]).map((row) => row.name)
  } catch (error) {
    report.db = `error: ${error instanceof Error ? error.message.split('\n')[0] : 'unknown'}`
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    report.blob = 'not configured'
  } else {
    try {
      await list({ limit: 1 })
      report.blob = 'ok'
    } catch (error) {
      report.blob = `error: ${error instanceof Error ? error.message : 'unknown'}`
    }
  }

  return Response.json(report)
}
