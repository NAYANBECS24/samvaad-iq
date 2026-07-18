# GitHub, Catalyst, and Slate Release Flow

## Repository outputs

- `npm run build` creates the Catalyst/Slate client artifact in `dist`.
- `functions/api` is the Node 24 Advanced I/O API.
- `functions/api/package.json` pins `zcatalyst-sdk-node` 3.3.0; deploy with its lockfile.
- `catalyst.json` maps both resources for Catalyst deployment.
- `catalyst-pipelines.yaml` validates, builds, tests, audits, and deploys when authenticated pipeline variables are present.
- `data/generated/` contains reproducible synthetic and QuickML assets.

## Branch policy

1. Develop and validate on `feat/netra-os`.
2. Push normal commits and open a review; never force-push the deployment branch.
3. Keep `pre-netra-os-edef150` as the source rollback tag.
4. Merge to `main` only after the deployed Catalyst judge mission passes.

## Catalyst pipeline variables

Configure secrets only in Catalyst Pipelines or the function environment:

- `PROJECT_ID`, `CATALYST_ORG`, `CATALYST_TOKEN`;
- `ALLOWED_ORIGINS`;
- a newly rotated `NVIDIA_API_KEY`;
- published QuickML endpoint keys;
- approved storage identifiers and provider configuration.

Do not store Docker passwords, OAuth tokens, endpoint keys, or judge credentials in Git.

## Canonical Catalyst build

- Install: `npm ci --ignore-scripts`, `npm --prefix client ci`, `npm --prefix functions/api ci`
- Validate: `npm run generate:data`, `npm run validate`, production dependency audits
- Client environment: `VITE_API_BASE=/server/api/api/v1` unless API Gateway maps `/api/v1`
- Deploy: Catalyst Web Client and the `api` function together

## Slate mirror

Slate remains a synchronized public mirror, not the API host.

- Repository: `NAYANBECS24/samvaad-iq`
- Branch: the reviewed release branch or `main` after acceptance
- Install: `npm ci`
- Build: `npm run build`
- Output: `dist`
- Build variable: `VITE_API_BASE=https://<approved-catalyst-or-gateway-origin>/server/api/api/v1`

After Slate deploys, hard-refresh a new browser profile and verify the hashed asset plus JSON health. Relative `/api/v1` paths on the Slate domain are invalid because Slate returns the SPA for those paths.

## Required release checks

```powershell
npm run validate
npm --prefix client audit --omit=dev --audit-level=high
npm --prefix functions/api audit --omit=dev --audit-level=high
$env:SAMVAAD_WEB_URL='https://<client-origin>'
$env:SAMVAAD_API_BASE='https://<api-origin>/server/api/api/v1'
npm run deployed:smoke
```

The release is accepted only when health/capabilities/AI status are JSON, the active data version matches across screens, role denial is server-enforced, citations open their sources, and the complete judge mission works without relying on a stale browser cache.
