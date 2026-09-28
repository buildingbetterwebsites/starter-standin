import type { Payload } from 'payload'

/**
 * A fresh Payload site lets the first visitor to /admin create the admin account. This closes that door:
 * on start, if no user exists yet, it creates one from FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD, which
 * the set-up guide asks you to add in Vercel BEFORE the first deployment.
 *
 * It fails CLOSED: with no user and no such variables, the site refuses to start rather than leave the
 * "create the first user" screen open to anyone.
 */
export async function createFirstAdmin(payload: Payload): Promise<void> {
  let existing: number
  try {
    existing = (await payload.count({ collection: 'users', overrideAccess: true })).totalDocs
  } catch (error) {
    // Only "the table does not exist yet" (Postgres 42P01: the migrations have not run, e.g. during
    // `payload migrate:create`) is expected here. Anything else, such as a time-out, stops the start.
    if (isMissingTable(error)) return
    throw error
  }
  if (existing > 0) return

  const email = process.env.FIRST_ADMIN_EMAIL
  const password = process.env.FIRST_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error(
      'No admin user exists and FIRST_ADMIN_EMAIL / FIRST_ADMIN_PASSWORD are not set. ' +
        'Add both in Vercel (Settings → Environment Variables) and redeploy.',
    )
  }

  try {
    await payload.create({ collection: 'users', data: { email, password }, overrideAccess: true })
    payload.logger.info(`First admin created: ${email}`)
  } catch (error) {
    // Two instances starting at the same moment: the other one created it first. Fine, if it now exists.
    const now = (await payload.count({ collection: 'users', overrideAccess: true })).totalDocs
    if (now === 0) throw error
  }
}

function isMissingTable(error: unknown): boolean {
  for (let e: unknown = error; e && typeof e === 'object'; e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === '42P01') return true
  }
  return false
}
