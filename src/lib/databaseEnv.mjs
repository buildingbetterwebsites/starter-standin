/**
 * Neon uses STORAGE_URL with Vercel's default integration prefix. DATABASE_URL
 * remains supported for local setup and integrations configured with that name.
 * Never include connection strings in errors: they contain credentials.
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} env
 */
export function databaseEnvironment(env) {
  const pooledUrl = selectUrl(env, 'DATABASE_URL', 'STORAGE_URL')
  const directUrl = selectUrl(env, 'DATABASE_URL_UNPOOLED', 'STORAGE_URL_UNPOOLED')
  return { pooledUrl, directUrl }
}

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} env
 * @param {string} databaseName
 * @param {string} storageName
 */
function selectUrl(env, databaseName, storageName) {
  const databaseValue = env[databaseName]?.trim()
  const storageValue = env[storageName]?.trim()
  if (databaseValue && storageValue && databaseValue !== storageValue) {
    throw new Error(`Conflicting ${databaseName} and ${storageName}; keep only one database connection for this environment.`)
  }
  return databaseValue || storageValue || ''
}
