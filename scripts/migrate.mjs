// Load TypeScript globally (`node --import tsx`), avoiding Payload CLI's scoped tsImport loader.
// Top-level await makes an unfinished import fail instead of silently exiting successfully.
process.env.PAYLOAD_MIGRATING = 'true'
process.env.NODE_ENV = 'production'

async function migrate() {
  const { default: payload } = await import('payload')
  const { default: config } = await import('../src/payload.config.ts')
  const { migrations } = await import('../src/migrations/index.ts')
  try {
    await payload.init({ config, disableOnInit: true })
    await payload.db.migrate({ migrations })
    const applied = await payload.find({ collection: 'payload-migrations', limit: 0 })
    const names = new Set(applied.docs.map((migration) => migration.name))
    const missing = migrations.filter((migration) => !names.has(migration.name))
    if (missing.length) throw new Error(`Migrations not applied: ${missing.map((m) => m.name).join(', ')}`)
  } finally {
    await payload.destroy()
  }
}

try {
  await migrate()
  // Payload 3.90.2's Postgres adapter retains a checked-out pool client after destroy().
  // Finish this dedicated CLI process explicitly, after flushing the verified completion marker.
  process.stdout.write('MIGRATIONS: verified committed migrations\n', () => process.exit(0))
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`, () => process.exit(1))
}
