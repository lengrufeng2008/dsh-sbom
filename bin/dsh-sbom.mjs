#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import { buildSbom, renderMarkdown } from '../src/sbom.mjs'
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) { console.log('dsh-sbom [dir] [--json] [--output FILE]\\n\\nCycloneDX 1.5 SBOM of root + top-level installed dependencies.'); process.exit(0) }
const value = (name) => { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1] }
const target = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--output') || '.'
try {
  const sbom = await buildSbom(target)
  const text = args.includes('--json') ? JSON.stringify(sbom, null, 2) : renderMarkdown(sbom)
  const out = value('--output')
  if (out) { await writeFile(out, text); console.log(`wrote ${out}: ${sbom.components.length} components`) }
  else process.stdout.write(text + '\n')
} catch (error) { console.error(`dsh-sbom: ${error.message}`); process.exitCode = 2 }
