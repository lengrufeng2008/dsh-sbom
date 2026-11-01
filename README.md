# SBOM for DSH

> CycloneDX 1.5 SBOM from a package and its top-level installed dependencies. No network, no full
> transitive resolution, no vulnerability claims.

## Use

```bash
node bin/dsh-sbom.mjs . --json --output sbom.json
node bin/dsh-sbom.mjs . --json | head
```

In DSH:

```text
Use sbom_export on this package, format=json.
```

## Output

- `metadata.component`: root application
- `components[]`: top-level installed `node_modules` libraries with name, version, license, purl

## Limits

- Installed top-level packages only
- No transitive graph, lockfile-only resolution, vulnerability DB, or signatures
- Not a complete supply-chain attestation

## Tests

```bash
npm test
```

## Provenance

A small independent CycloneDX emitter. License: MIT.
