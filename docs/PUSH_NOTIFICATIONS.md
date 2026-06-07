# Push Notifications Setup (VAPID + Scheduler)

This document explains how to generate VAPID keys, configure the app, and schedule daily push notifications.

1) Generate VAPID keys

- Install `web-push` (one-time):

```bash
pnpm add -D web-push
```

- Run the generator script (provided):

```bash
pnpm dlx node scripts/generate-vapid.js
# or if you've installed web-push as a dev dependency:
pnpm exec node scripts/generate-vapid.js
```

The script prints JSON with `publicKey` and `privateKey`.

2) Configure environment variables

- Client (Vite): add to `.env` or your deployment pipeline:

```
VITE_VAPID_PUBLIC_KEY=<publicKey>
```

- Server (Supabase Function or other server): set these secret env vars:

```
VAPID_PUBLIC_KEY=<publicKey>
VAPID_PRIVATE_KEY=<privateKey>
VAPID_SUBJECT=mailto:admin@example.com
```

3) Scheduler (example GitHub Actions)

- Create repository secrets:
  - `SCHEDULER_ENDPOINT` — Full URL to `POST /make-server-549f93eb/send-push` on your deployed server.
  - `SCHEDULER_ADMIN_TOKEN` — A Bearer token for an admin user (service role or admin user access token).

- Example workflow file is included at `.github/workflows/send_push.yml` (runs daily).

4) Testing

- On a local browser, open the app, sign in as a user, click "Enable Notifications" in the offers notification. Grant permission.
- Run the workflow manually (or call `POST /send-push`) to send a test payload.

Notes
- Web push will only be delivered to subscriptions created for HTTPS origins or `localhost` during development.
- Storing subscriptions requires you to protect the `POST /subscriptions` endpoint; the implementation stores per-user subscriptions.
