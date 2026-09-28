import type { Payload } from 'payload'

/**
 * A fresh Payload site lets the first visitor to /admin create the admin account. This closes that door:
 * on start, if no user exists yet, it creates one from FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD, which
 * the set-up guide asks you to add in Vercel BEFORE the first deployment.
 */
export async function createFirstAdmin(payload: Payload): Promise<void> {
  const email = process.env.FIRST_ADMIN_EMAIL
  const password = process.env.FIRST_ADMIN_PASSWORD

  let existing: number
  try {
    existing = (await payload.count({ collection: 'users', overrideAccess: true })).totalDocs
  } catch {
    // No tables yet (the migrations have not run): nothing to do now.
    return
  }
  if (existing > 0) return

  if (!email || !password) {
    payload.logger.warn(
      'No user exists and FIRST_ADMIN_EMAIL / FIRST_ADMIN_PASSWORD are not set: add them in Vercel and redeploy.',
    )
    return
  }

  await payload.create({ collection: 'users', data: { email, password }, overrideAccess: true })
  payload.logger.info(`First admin created: ${email}`)
}
