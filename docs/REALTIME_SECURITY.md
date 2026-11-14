# Realtime authentication and browser origins

Socket.IO requires the same ATHLIX bearer JWT as protected HTTP endpoints. Send
the token through `auth.token`; query-string tokens and client-supplied user IDs
are not accepted. The server verifies HS256, expiry, the user ID, account existence
and active status before joining the account's notification room. Existing
booking and social publishers continue to target that server-derived user ID.

There is no `join_user_room` handler. The client must never request a personal
room. Token changes recreate the client connection, and reconnects read the
current token. The server disconnects sessions at JWT expiry and checks account
disabling every 30 seconds, including for passive subscribers. A database lookup
failure closes the connection. This is bounded revocation, not immediate global
logout; token revocation/versioning remains a separate session-hardening task.

Authenticated users can subscribe with
`socket.emit('join_tournament_room', tournamentId, acknowledge)` and unsubscribe
with `leave_tournament_room`. IDs must be real MongoDB ObjectIDs belonging to
existing tournaments. This matches current authenticated tournament GET access;
it does not grant tournament write permission. If tournament visibility becomes
private, update both HTTP read authorization and subscription authorization.
The acknowledgement is `{ success, message? }`. Clients must resubscribe on
`connect`, because reconnecting creates a new session. Each socket has at most
10 tournament subscriptions and 20 join attempts per minute. Event payloads are
limited to 32 KiB.

## Configuration

Set `ALLOWED_ORIGIN` on the Node backend to a comma-separated list of browser
origins, for example `https://athlix.example,https://www.athlix.example`. HTTP
and Socket.IO use this shared exact-origin policy; WebSocket upgrades also enforce
it. Wildcards, credentials, URL paths and opaque `null` origins are rejected.
Production startup fails when the allowlist is missing or malformed. Development
defaults to `http://localhost:3000` and `http://127.0.0.1:3000` only. Native clients
with no Origin header still require authentication; CORS is not an authentication
boundary.

Run `npm run test --workspace athlix-server` for real loopback handshake,
cross-account isolation, token expiry, disabled-account, subscription and origin
regressions. Database lookups use deterministic account fixtures in these tests;
external MongoDB and Firebase are not contacted.
