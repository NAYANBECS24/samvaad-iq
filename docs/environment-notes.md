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

Next Catalyst steps:

```powershell
catalyst login
catalyst init --force
catalyst client:setup
catalyst functions:setup
catalyst serve
catalyst deploy
```

When prompted by Catalyst CLI, use the existing `client` folder and `functions` folder.
