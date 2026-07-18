# Environment and Capability Notes

## Local toolchain

- Node.js 24-compatible runtime, npm, Git, and Catalyst CLI are installed.
- React and API dependencies are locked.
- The shared deterministic generator produces the synthetic browser and server datasets.
- `catalyst.json`, `catalyst-pipelines.yaml`, and the Node 24 Advanced I/O target are present.

## Authentication state

The Catalyst CLI requires an authenticated project-owner session before deployment. Repository preparation, local validation, Git commits, and Slate builds do not grant Catalyst console authority.

Use:

```powershell
catalyst login
catalyst project:list
catalyst deploy
```

Do not commit CLI tokens, project secrets, judge passwords, NVIDIA keys, QuickML endpoint keys, or storage identifiers.

## Runtime configuration

Runtime truth is reported independently for API reachability, authentication, data source, persistence, NVIDIA, QuickML, OCR, storage, PDF rendering, and orchestration. Environment flags only permit a canary attempt; the UI must not call a provider available until that canary succeeds.

The authoritative written snapshot is `docs/verified-state.md`. It intentionally does not assert a promoted URL or optional live provider.

The canonical Catalyst Web Client should use the same-platform API route. The Slate mirror must receive the full approved API origin through its build environment because relative API paths on Slate resolve to the SPA.

## Synthetic-only boundary

No real FIR, citizen identifier, police credential, evidence file, or restricted operational detail belongs in the repository or public deployment. All public demonstrations use `SYN-*` identifiers and masked entities.
