import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { test } from 'node:test'
import { databaseEnvironment } from '../src/lib/databaseEnv.mjs'

const source = readFileSync(new URL('./build.mjs', import.meta.url), 'utf8').replace(/^import [^\n]+\n/gm, '')
function build(environment, migration) {
  const calls = []
  const messages = []
  const context = {
    databaseEnvironment,
    spawnSync: (...args) => {
      calls.push(args)
      return calls.length === 1 && environment === 'production' ? migration : { status: 0 }
    },
    process: {
      env: { VERCEL_ENV: environment, DATABASE_URL: 'test-pooled', DATABASE_URL_UNPOOLED: 'test-direct', PAYLOAD_SECRET: 'x'.repeat(32) },
      execPath: 'node',
      stdout: { write: () => {} }, stderr: { write: () => {} },
      exit: (code) => { throw new Error(`exit ${code}`) },
    },
    console: { log: (message) => messages.push(message), error: (message) => messages.push(message) },
  }
  let failure
  try { vm.runInNewContext(source, context) } catch (error) { failure = error.message }
  return { calls, messages, failure }
}

test('silent migration exit 0 fails the build before Next runs', () => {
  const result = build('production', { status: 0, stdout: '', stderr: '' })
  assert.equal(result.failure, 'exit 1')
  assert.equal(result.calls.length, 1)
  assert.ok(!result.messages.includes('MIGRATIONS: ran'))
})

test('nonzero exit or timeout fails even with a completion marker', () => {
  for (const status of [1, null]) {
    assert.equal(build('production', { status, stdout: 'MIGRATIONS: verified committed migrations\n' }).failure, 'exit 1')
  }
})

test('verified migration runs Next and uses the direct connection', () => {
  const result = build('production', { status: 0, stdout: 'MIGRATIONS: verified committed migrations\n' })
  assert.equal(result.failure, undefined)
  assert.equal(result.calls.length, 2)
  assert.equal(result.calls[0][2].env.DATABASE_URL, 'test-direct')
  assert.equal(result.calls[0][2].env.STORAGE_URL, 'test-direct')
  assert.ok(result.messages.includes('MIGRATIONS: ran'))
})

test('preview does not start the migration process', () => {
  const result = build('preview', {})
  assert.equal(result.failure, undefined)
  assert.equal(result.calls.length, 1)
  assert.ok(result.calls[0][0].includes('next build'))
  assert.ok(result.messages.includes('MIGRATIONS: skipped (preview)'))
})
