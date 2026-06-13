# Security Review — API Routes & RLS (June 2026)

Scope: `app/api/auth/forgot-password`, `reset-password`, `verify-email`, `register`,
`app/api/careers`, `catering`, `contact`, `reviews`, plus the Supabase RLS
assumptions behind the client-side `orders` / `notifications` / `reviews` inserts.
(`auth.ts`, `middleware.ts`, `app/api/admin/users`, register role-forcing were
reviewed previously and are not re-covered here.)

---

## Fixed in this change set

### 1. CRITICAL — careers/catering/contact GET & PATCH had no authentication
`GET /api/careers`, `GET /api/catering`, `GET /api/contact` returned **every**
job application (name, email, phone, cover letter, CV link), catering inquiry,
and contact message to **any unauthenticated caller**, using the service-role
key (bypasses RLS). `PATCH` likewise let anyone change statuses/notes.
Note: `middleware.ts` deliberately skips `/api/*`, so API routes must enforce
their own auth — these didn't.
**Fix:** all three GET/PATCH handlers now require a NextAuth session with
`role === 'admin'` (same pattern as `PATCH /api/reviews`). The admin dashboard
views (`AdminCareersView` etc.) are the only callers and run as admin, so
nothing user-facing changes.

### 2. Verbose DB error leakage to clients
- `register` returned raw Postgres error `message`, `code`, and `details`, plus
  `"Check SUPABASE_SERVICE_ROLE_KEY"` hints.
- careers/catering/contact returned `error.message` / `err.message` from the DB
  and exceptions.
**Fix:** all of these now return generic messages; full details still go to
`console.error` (server logs only).

### 3. Password-reset token was logged in plaintext
`forgot-password` logged the complete reset link (token included) to the server
console (= Vercel logs) instead of emailing it — the TODO email was never built.
**Fix:** added `sendPasswordResetEmail()` to `lib/mailer.ts` (uses the existing
Gmail transporter) and the route now emails the link. The token is never logged.
Anti-enumeration behaviour (always return `{success:true}`) is preserved.

### 4. Unvalidated CV upload (careers)
Any file type/size could be uploaded to the public `cv-uploads` bucket with a
user-influenced filename and user-controlled content type (XSS/abuse vector).
**Fix:** extension allowlist (`pdf`, `doc`, `docx`), 5 MB cap, filename
sanitised to `[a-zA-Z0-9-]`.

### 5. Minor hardening
- `GET /api/reviews`: `limit` query param now clamped to 1–50 (was unbounded).
- `verify-email`: no longer uses `!` non-null assertions on env vars (would
  crash unconfigured); falls back to a safe redirect.
- `lib/mailer.ts`: user-supplied `fullName` is now HTML-escaped before being
  interpolated into email HTML.

---

## Findings NOT fixed in code — need DB-side action or a product decision

### A. CRITICAL — RLS lets anonymous users read ALL orders
`COMPLETE-DATABASE-SETUP.sql` creates:

```sql
CREATE POLICY "Anyone can view orders by phone" ON orders FOR SELECT TO anon
  USING (true);
```

`USING (true)` means anyone with the public anon key (it ships in the browser
bundle) can `select *` from `orders` — every customer name, phone number and
delivery address. The tracking page only needs lookups by order id/phone, which
RLS alone cannot express safely. **Recommendation:** drop this policy and move
order tracking behind a server API route (service role + explicit
phone+order-id match), or at minimum restrict the policy's columns/conditions.
Verify what is actually live in the Supabase dashboard — migrations in
`supabase/migrations/` also add broad `USING (true)` anon read/update policies
on `table_orders`, `table_sessions`, and (in `20260203_table_sessions.sql`)
`table_pins`-adjacent tables.

### B. HIGH — Anonymous insert/update on orders means the ordering kill switch is UI-level only
`"Anyone can insert orders" ... TO anon WITH CHECK (true)` (and the
anyone-can-update policies on `table_orders`) mean a technical user with the
anon key could still insert/modify orders while `ORDERING_ENABLED = false` —
the switch gates every code path in the app, but not the database. For the
launch-pause period this is acceptable for "no one *mistakenly* places an
order", but for true enforcement either (a) temporarily drop the anon insert
policy in Supabase, or (b) longer-term, move order creation to a server API
route and remove anon insert entirely.

### C. MEDIUM — No rate limiting anywhere
`register`, `forgot-password`, `reset-password`, `contact`, `careers`,
`catering`, `reviews` can all be hammered (spam signups, email-sending abuse,
review spam, reset-token griefing). Vercel has no built-in per-route limiter.
**Recommendation:** add a limiter (e.g. Upstash Ratelimit via Redis, or
Vercel WAF rules) on the auth + form endpoints. Not implemented here because it
requires new infrastructure/credentials.

### D. LOW — Account enumeration on register
`register` returns 409 "An account with this email already exists". Standard
UX trade-off (forgot-password already avoids enumeration); fixing it would hurt
usability. Left as-is, noted for completeness.

### E. LOW — Anonymous reviews accepted
`POST /api/reviews` allows unauthenticated reviews by design (`is_verified`
distinguishes them). Combined with (C), this is a spam vector; consider
requiring login or adding CAPTCHA when traffic grows.

### F. Injection review — clean
All DB access goes through supabase-js builders (parameterised; no raw SQL/
string concatenation). No `dangerouslySetInnerHTML` of user input found in the
reviewed routes. Email HTML interpolation is now escaped (mailer); the
templates in `lib/email.ts` interpolate user input into staff-facing emails —
acceptable risk, but escaping there too would be a nice follow-up.
