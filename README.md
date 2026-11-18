# spendseer-site

The owner's control room for SpendSeer. Same idea as `RosterView/rosterview-site`.

- **Live:** https://ashukai.github.io/spendseer/control.html
- **Demo:** add `#demo` — made-up data, no sign-in, nothing leaves the server.
- **Repo:** `ashukai/spendseer` (public). It also holds `Budgeta/`, the old Vite
  web prototype. `push-site.sh` never touches anything but the files you name.

## Pushing a change

```bash
./push-site.sh                      # control.html
MSG="Control room: trips tab" ./push-site.sh
```

Then check it landed:

```bash
gh api repos/ashukai/spendseer/pages/builds/latest --jq .status
curl -s https://ashukai.github.io/spendseer/control.html | grep -c somethingYouChanged
```

## The server side

`sql/01-control-room.sql`, run once in the Supabase SQL editor for project
`vtmmuksezzrsbnxteofw`. It adds:

- `admins` — RLS on, **no policies**, so nothing reaches it but the functions below.
- `is_admin()` / `cr_guard()` — `cr_guard()` has EXECUTE revoked from everyone;
  only the security-definer functions, running as the owner, can call it.
- `admin_cr_summary` · `admin_cr_users` · `admin_cr_daily` · `admin_cr_currencies`
  · `admin_cr_categories` · `admin_cr_trips` · `admin_cr_retention`
  · `admin_cr_user_days` — each calls `cr_guard()` first.

The page uses the same **public anon key** the app ships with. That key grants
nothing here: a signed-in account that is not in `admins` is refused by every
function, and an anonymous caller likewise.

## What it does NOT show, and why

**No expense amounts and no note text.** Running the app needs to know whether
somebody uses it, not what they spend. Both are one column away in
`admin_cr_users` if that ever changes.

**"Active" means they logged an expense.** The app does not report when it is
merely opened, so there is no "who is online now" and no screen-by-screen
funnel. Those need a `log_events`-style table plus an app change — and, because
it would be new data collection, a privacy-policy section and Usage Data /
Diagnostics on the App Store privacy labels, exactly as RosterView had to do.

**Crashes are not here yet.** `src/lib/diagnostics.ts` in the app already
records them, but only to the phone; the user has to send the report by hand.
Shipping those to the server is the natural next step.

## Testing the SQL

The functions were checked against a throwaway Postgres 17 with a stubbed
`auth` schema (see the session notes): every figure matched a known seed, and
under `set role authenticated` a non-admin was refused by all eight functions
and could neither read nor write `admins`.
