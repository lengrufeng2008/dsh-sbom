import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSbom, renderMarkdown } from '../src/sbom.mjs'
const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url))
const SKILL_PATH = join(PLUGIN_DIR, '..', 'skills', 'sbom', 'SKILL.md')
const PROVIDER = 'dsh-sbom'
export const name = 'sbom'
export const inject = ['tools', 'skills']
function stripFrontmatter(text) { if (!text.startsWith('---\n')) return text; const end = text.indexOf('\n---\n', 4); return end === -1 ? text : text.slice(end + 5) }
const summary = { name: 'sbom', description: 'Generate a CycloneDX 1.5 SBOM from a package and its top-level installed dependencies. No network; not a full transitive graph.', whenToUse: 'A package needs a machine-readable component/license inventory for release or review.', invocation: { modelInvocable: true, userInvocable: true }, source: 'bundled', provider: PROVIDER, resourceBase: { kind: 'directory', path: join(PLUGIN_DIR, '..', 'skills', 'sbom') }, rank: 600, locator: 'sbom', metadata: { domain: 'supply-chain', version: '0.1.0' } }
export function apply(ctx) {
  ctx.tools.register({ name: 'sbom_export', description: 'Build a CycloneDX 1.5 SBOM from a local package and top-level installed node_modules. Read-only; no network; not a full transitive graph.', parameters: { type: 'object', additionalProperties: false, properties: { path: { type: 'string' }, format: { type: 'string', enum: ['markdown', 'json'] } }, required: ['path'] }, output: { schema: { type: 'object', additionalProperties: false, properties: { markdown: { type: 'string' }, components: { type: 'integer' }, sbom: { type: 'string' } }, required: ['markdown', 'components', 'sbom'] }, render: (_a, v) => [{ type: 'text', text: v.markdown }] }, timeoutMs: 30_000, async execute(args = {}) { const s = await buildSbom(args.path); return { markdown: args.format === 'json' ? JSON.stringify(s, null, 2) : renderMarkdown(s), components: s.components.length, sbom: JSON.stringify(s) } } })
  ctx.skills.registerProvider(() => ({ name: PROVIDER, async list() { return [summary] }, async get(c) { if (c?.name !== 'sbom') return undefined; return { ...summary, content: stripFrontmatter(await readFile(SKILL_PATH, 'utf8')) } } }))
}
