import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

const marker = 'MIGRATIONS: verified committed migrations'
// A live timer models the connection that Payload's adapter retains after destroy().
const payloadSource = `
setInterval(() => {}, 1000);
export default {
  async init(options) {
    if (!options.disableOnInit) throw Error('first-admin hook must stay disabled');
    if (process.env.RUNNER_TEST_MODE === 'init-error') throw Error('init failed');
  },
  db: { async migrate() {
    if (process.env.RUNNER_TEST_MODE === 'adapter-exit') process.exit(0);
    if (process.env.RUNNER_TEST_MODE === 'migration-error') throw Error('migration failed');
  } },
  async find() { return {docs: process.env.RUNNER_TEST_MODE === 'missing' ? [] : [{name:'initial'}]}; },
  async destroy() { console.log('CLEANUP'); }
};`
const loader = `
const sources = ${JSON.stringify({
  payload: payloadSource,
  '../src/payload.config.ts': 'export default {};',
  '../src/migrations/index.ts': "export const migrations = [{name:'initial'}];",
})};
export async function resolve(specifier, context, next) {
  if (sources[specifier]) return {url:'data:text/javascript,'+encodeURIComponent(sources[specifier]),shortCircuit:true};
  return next(specifier, context);
}`

function run(mode) {
  return spawnSync(process.execPath, ['--loader', `data:text/javascript,${encodeURIComponent(loader)}`, 'scripts/migrate.mjs'], {
    cwd: new URL('..', import.meta.url), encoding: 'utf8', timeout: 5000,
    env: { ...process.env, RUNNER_TEST_MODE: mode },
  })
}

test('real runner verifies, cleans up and exits with a retained connection handle', () => {
  const result = run('success')
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.signal, null)
  assert.match(result.stdout, /CLEANUP\nMIGRATIONS: verified committed migrations\n/)
})

test('real runner exits nonzero and never marks missing migrations or init/migration errors successful', () => {
  for (const mode of ['missing', 'init-error', 'migration-error']) {
    const result = run(mode)
    assert.equal(result.status, 1, result.stderr)
    assert.ok(result.stdout.includes('CLEANUP'))
    assert.ok(!result.stdout.includes(marker))
  }
})

test('an adapter that exits zero early cannot emit the verification marker', () => {
  const result = run('adapter-exit')
  assert.equal(result.status, 0)
  assert.ok(!result.stdout.includes(marker))
})
