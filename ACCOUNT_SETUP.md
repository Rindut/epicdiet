# Private account and sync

## Local review

Run `node tools/setup-account.mjs rina` once, then `npm run dev`.
The setup prints a random password once and creates a mode-0600 `.env.local`.
Only a salted scrypt hash is stored. The file and `.local/` are ignored by Git.
The default development address is **http://localhost:3040**. Use that exact
address: write requests from alternate origins are intentionally rejected.

Local development saves account data in `.local/server-data.json`, outside
the public `dist` directory. It is a single-process test adapter, not a cloud
database. Keep a backup of this file. Restarting the server preserves entries.

## Production prerequisites

Create a dedicated, persistent Upstash Redis database for Epic Diet Tracker.
Do not use temporary/expiring databases for journal data or reuse another
application's database credentials.

Configure these environment variables in the Vercel **Production** environment:

| Name | Value |
|---|---|
| EPIC_USERNAME | Your username, e.g. rina |
| EPIC_PASSWORD_HASH | Salted hash generated for the account |
| EPIC_ORIGIN | https://epicdiet.vercel.app |
| EPIC_STORAGE | redis |
| UPSTASH_REDIS_REST_URL | Database HTTPS REST URL |
| UPSTASH_REDIS_REST_TOKEN | Database read/write REST token |

Never add the password, hash, or Redis token to frontend files or Git.
Preview deployments need their own exact origin and a separate test database.
Production refuses the local adapter. Missing configuration fails closed.
Adding credentials requires a new deployment. The existing static frontend
configuration is retained; the root `api/` folder supplies Node.js functions.

Provider references:
- https://vercel.com/docs/functions/runtimes/node-js
- https://upstash.com/docs/redis/features/restapi

## Account behavior

- No public registration or shared browser password.
- Session IDs are random; only their hashes are stored server-side, for 7 days.
- Production cookies use Secure, HttpOnly, SameSite=Strict and the __Host prefix.
- Mutations require the configured same-origin Origin header.
- Account-wide limit: 20 login attempts per 15 minutes, stored centrally.
- All private API endpoints require a valid session.
- Logout revokes that session. Rotating the password hash revokes all sessions.
- To reset a forgotten password, an owner must generate a new hash and replace
  EPIC_PASSWORD_HASH securely. There is no email recovery service.
- Entries save only after pressing Save. There is no offline write queue.
- Revision checks are atomic in Redis; an outdated device gets a conflict
  instead of silently overwriting a newer record.
- Returning to the app refreshes saved data if there are no unsaved edits.
- The legacy IndexedDB data is left untouched. On an empty account, the user
  can explicitly choose to copy the old data. There is no automatic merge.
- Deleting the account's journey affects all connected devices. Its revision
  is retained so an old device cannot restore deleted data by saving stale data.
- Export CSV before important changes. Redis persistence is not a replacement
  for backups. Configure provider backups before relying on this as the only copy.

## Release status

Local login and the shared-server workflow are testable.
Internet synchronization is **not active** until the permanent database and
Vercel environment variables above have been configured and deployed.
