import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

import { databaseEnvironment } from '../src/lib/databaseEnv.mjs'

test('accepts the default Vercel Neon prefix and its direct URL', () => {
  assert.deepEqual(databaseEnvironment({
    STORAGE_URL: 'postgres://pooled.example/test',
    STORAGE_URL_UNPOOLED: 'postgres://direct.example/test',
  }), {
    pooledUrl: 'postgres://pooled.example/test',
    directUrl: 'postgres://direct.example/test',
  })
})

test('accepts DATABASE_URL for local setup', () => {
  assert.deepEqual(databaseEnvironment({ DATABASE_URL: 'postgres://local.example/test' }), {
    pooledUrl: 'postgres://local.example/test',
    directUrl: '',
  })
})

test('ignores a blank detected DATABASE_URL row when Neon provides STORAGE_URL', () => {
  assert.equal(databaseEnvironment({ DATABASE_URL: '', STORAGE_URL: 'postgres://pooled.example/test' }).pooledUrl,
    'postgres://pooled.example/test')
})

test('refuses conflicting pooled or direct connections without revealing credentials', () => {
  for (const [first, second] of [
    ['DATABASE_URL', 'STORAGE_URL'],
    ['DATABASE_URL_UNPOOLED', 'STORAGE_URL_UNPOOLED'],
  ]) {
    assert.throws(() => databaseEnvironment({
      [first]: 'postgres://secret-one@example/test',
      [second]: 'postgres://secret-two@example/test',
    }), (error) => {
      assert.match(error.message, /Conflicting/)
      assert.doesNotMatch(error.message, /secret-one|secret-two/)
      return true
    })
  }
})

test('the Vercel build guard accepts STORAGE_URL before checking other required settings', () => {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    env: {
      ...process.env,
      VERCEL_ENV: 'preview',
      DATABASE_URL: '',
      DATABASE_URL_UNPOOLED: '',
      STORAGE_URL: 'postgres://example.invalid/test',
      STORAGE_URL_UNPOOLED: '',
      PAYLOAD_SECRET: '',
    },
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /PAYLOAD_SECRET is missing/)
  assert.doesNotMatch(result.stderr, /there is no database|example\.invalid/)
})
