import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSbom } from '../src/sbom.mjs'
import { apply } from '../plugin/index.js'
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
test('builds a CycloneDX SBOM with root and dependency', async () => {
  const s = await buildSbom(join(ROOT, 'test/fixtures/demo'))
  assert.equal(s.bomFormat, 'CycloneDX')
  assert.equal(s.specVersion, '1.5')
  assert.equal(s.metadata.component.name, 'demo')
  assert.equal(s.components.length, 1)
  assert.equal(s.components[0].name, 'mit-pkg')
  assert.match(s.components[0].purl, /^pkg:npm\//)
})
test('CLI emits JSON and plugin registers', async () => {
  const r = spawnSync(process.execPath, [join(ROOT, 'bin/dsh-sbom.mjs'), join(ROOT, 'test/fixtures/demo'), '--json'], { encoding: 'utf8' })
  assert.equal(r.status, 0)
  assert.match(r.stdout, /CycloneDX/)
  const tools = []; let factory
  apply({ tools: { register: (t) => tools.push(t) }, skills: { registerProvider: (fn) => { factory = fn } } })
  assert.equal(tools[0].name, 'sbom_export')
  const result = await tools[0].execute({ path: join(ROOT, 'test/fixtures/demo') })
  assert.equal(result.components, 1)
  assert.equal((await factory().list())[0].name, 'sbom')
})
