# Safe Catalyst and Slate Deployment

## 1. Preserve the current release

- Keep `pre-winner-upgrade-92b19b7` as the rollback tag.
- Deploy `feat/winner-catalyst-upgrade` to Catalyst Development first.
- Do not change the current Slate production source until the Catalyst candidate passes the judge journey.

## 2. Configure the Catalyst candidate

1. Bind the repository to the existing Catalyst project with the CLI.
2. Provision the Data Store tables from `data/catalyst-schema.md`.
3. Create invited Catalyst Auth users and map them to Investigator, Analyst, Supervisor, or Admin server roles.
4. Deploy the `api` Advanced I/O function and web client.
5. Build the client with `VITE_API_BASE=/server/api/api/v1`, or configure API Gateway to map `/api/v1/*` to `/server/api/api/v1/*`.
6. Keep optional service flags false until each provider call is verified in Development.
7. Store allowed origins, secrets, project IDs, bucket names, and tokens in Catalyst variables rather than Git.

## 3. Validate before promotion

```bash
npm run validate
npm --prefix client audit --omit=dev
npm --prefix functions/api audit --omit=dev
catalyst serve
```

Verify that `/api/v1/health` is JSON, the capability mode is honest, unauthorized audit/report requests fail, all citations open cases, evidence hashes match, and the complete demo works in a fresh browser.

## 4. Promote without breaking Slate

- Promote the Catalyst candidate to a separate judge URL.
- Make that URL canonical only after deployed smoke tests pass.
- Configure Slate Git deployment with install command `npm ci`, build command `npm run build`, and output directory `dist`.
- Purge or invalidate Slate CDN cache if available and verify the new hashed asset name.
- Remove the legacy root static bundle only after Slate is confirmed to build from `dist`.

## 5. Rollback

If authentication, API health, or the judge journey fails, restore the previous successful Catalyst deployment and point public links back to the untouched Slate site. Do not force-push or rewrite `main`.
