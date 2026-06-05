# Environment Notes

Local checks completed:

- Node.js: installed
- npm: installed
- Git: installed
- Zoho Catalyst CLI: installed as `catalyst`
- React client dependencies: installed
- Prototype seed data: copied to `data/` and `client/src/data/`
- Live field metrics: Open-Meteo weather API with no-key fallback behavior
- Catalyst login/project binding: pending user browser login
- Catalyst GitHub readiness: `catalyst.json`, `catalyst-pipelines.yaml`, and `docs/catalyst-github-deployment.md` prepared

Next Catalyst steps:

```powershell
catalyst login
catalyst init --force
catalyst client:setup
catalyst functions:setup
catalyst serve
catalyst deploy
```

When binding resources locally, use the existing `functions` folder for the API. For the web client, run `npm run build` first and deploy the generated `dist` folder, as configured in `catalyst.json`.

For GitHub auto-fetch deployment, use Catalyst Pipelines with the root `catalyst-pipelines.yaml` file. The pipeline builds the React client into `dist`, then deploys the generated client package and `functions/api` target using `catalyst.json`.
