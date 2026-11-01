---
name: sbom
description: Generate a CycloneDX 1.5 SBOM from a package and its top-level installed dependencies. Use sbom_export for a machine-readable component/license inventory.
whenToUse: "A package needs an SBOM for release, review, or supply-chain handoff."
---

# SBOM

```text
Use sbom_export on this package, format=json.
```

It emits CycloneDX 1.5 JSON with the root application and top-level installed `node_modules`
components, versions, licenses, and npm purls.

## Limits

- Top-level installed packages only; no full transitive dependency graph.
- No lockfile-only resolution; components must be installed.
- No vulnerability lookup, provenance/signature, or network.
- Not a complete supply-chain attestation.
