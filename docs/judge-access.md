# NETRA OS Judge Access Instructions

## Public Judge Demo

Open `/login`, stay on **Judge Demo**, and select one of the four fixed synthetic profiles:

| Profile | Demonstration scope |
| --- | --- |
| Investigator | Ask SAMVAAD, cases, evidence intake, intelligence, patrol/tablet, draft/report request |
| Analyst | Mission Control, chat, cases, intelligence, reports, governance |
| Supervisor | Operational workspaces, task decision, official report approval/export |
| Admin | Every application plus data/pipeline administration |

When server demo sessions are explicitly enabled, the API creates a short-lived signed role session. When they are not enabled, the application must identify the session as the read-only Offline Demo and must not claim server persistence or official export.

No default password is documented because credentials are environment-specific. Do not guess or publish one.

## Invitation-only secure access

The **Secure sign-in** option redirects to Catalyst Auth only when the server reports a configured, verified invitation-only URL. Public registration and the embedded Catalyst login widget are disabled. Invited account details are delivered to judges through the approved private channel, not Git, the deck, screenshots, or chat.

## Preflight for organizers

1. Open the canonical URL in a clean browser profile.
2. Confirm the client hash matches the accepted release.
3. Confirm `/api/v1/health`, `/capabilities`, and `/ai/status` return JSON.
4. Confirm the UI/API data version is `synthetic-20260717-1000` after Data Store activation, or clearly reports the current server/offline seed instead.
5. Test every Judge Demo role and one invited secure account if secure access is part of the presentation.
6. Prove Analyst cannot enter evidence intake, patrol/tablet, or administration.
7. Prove Investigator/Analyst cannot approve or request an official server export directly.
8. Confirm Supervisor/Admin can decide the approval only through an authenticated API session.
9. Clear prior local/session storage before the judged run.

## Credentials and secrets

- Never commit judge passwords, demo signing secrets, Catalyst tokens, provider keys, secure URLs containing tokens, or recovery codes.
- Rotate any secret exposed in source, logs, screenshots, chat, or presentation material.
- Use short-lived judge accounts and remove/disable them after the event.
- Keep public synthetic demo identities separate from real KSP/Catalyst users.

## Failure behavior

If secure login or the API fails, demonstrate only the clearly labeled read-only Offline Demo. Do not silently elevate a browser role, manufacture a successful login, or show a provider/persistence/official-report claim that the runtime cannot prove.
