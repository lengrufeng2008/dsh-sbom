import { readFile, readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

function licenseOf(pkg) {
  if (typeof pkg.license === 'string') return [{ license: { id: pkg.license } }]
  if (Array.isArray(pkg.licenses)) return pkg.licenses.map((l) => ({ license: { id: l.type || l } }))
  return undefined
}
async function readPackage(path) { try { return JSON.parse(await readFile(path, 'utf8')) } catch { return undefined } }

export async function buildSbom(input) {
  const root = await resolve(input)
  const info = await stat(root).catch(() => null)
  if (!info?.isDirectory()) throw new Error(`not a directory: ${input}`)
  const rootPkg = await readPackage(join(root, 'package.json'))
  if (!rootPkg) throw new Error('package.json not found')
  const components = []
  const nodeModules = join(root, 'node_modules')
  if (await stat(nodeModules).catch(() => null)) {
    for (const entry of await readdir(nodeModules, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      const dirs = entry.name.startsWith('@') ? (await readdir(join(nodeModules, entry.name), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => join(entry.name, e.name)) : [entry.name]
      for (const dir of dirs) {
        const pkg = await readPackage(join(nodeModules, dir, 'package.json'))
        if (!pkg) continue
        const name = pkg.name || dir
        const version = pkg.version || '0.0.0'
        components.push({
          type: 'library', name, version,
          ...(licenseOf(pkg) ? { licenses: licenseOf(pkg) } : {}),
          purl: `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(version)}`,
        })
        if (components.length >= 2000) break
      }
    }
  }
  return {
    bomFormat: 'CycloneDX', specVersion: '1.5', version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{ vendor: 'dsh-contribution-lab', name: 'dsh-sbom', version: '0.1.0' }],
      component: { type: 'application', name: rootPkg.name || 'unknown', version: rootPkg.version || '0.0.0', ...(licenseOf(rootPkg) ? { licenses: licenseOf(rootPkg) } : {}) },
    },
    components,
  }
}
export function renderMarkdown(sbom) {
  return [`# SBOM: ${sbom.metadata.component.name}@${sbom.metadata.component.version}`, '', `- format: ${sbom.bomFormat} ${sbom.specVersion}`, `- components: ${sbom.components.length}`, '', '| Component | Version | License |', '| --- | --- | --- |', ...sbom.components.map((c) => `| ${c.name} | ${c.version} | ${c.licenses?.map((l) => l.license?.id || 'unknown').join(', ') || 'unknown'} |`), '', 'Top-level installed components only; no full transitive graph, no network.'].join('\n')
}
