# TrackFleet

Vehicle, driver and delivery operations

This repository is a deployable Vercel-ready application scaffold with Next.js, Supabase Auth, PostgreSQL schema/migrations, row-level security (RLS), environment examples, tests, and operational guidance. You must configure your own Supabase project and provider credentials before it can serve real customers.

## Requirements
- Node.js 20.19+ (use a currently supported Node LTS)
- npm
- A Supabase project (PostgreSQL + Auth)
- Vercel account for online deployment

## Local setup
1. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key.
2. In Supabase SQL Editor, apply the SQL migration in `supabase/migrations/` in filename order.
3. In Supabase Authentication settings, set your local Site URL to `http://localhost:3000`, enable email confirmation as appropriate, and configure allowed redirect URLs.
4. Run `npm install`.
5. Run `npm run dev` and open `http://localhost:3000`.
6. Run `npm test` and `npm run build` before release.

## Deploy to Vercel
1. Push this folder to its own Git repository, or import it as a separate Vercel project.
2. In Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Development, Preview, and Production.
3. Add any server-only secrets documented in `.env.example` only when using the matching server route. Never prefix secrets with `NEXT_PUBLIC_`.
4. Deploy. Apply database migrations to the Supabase production project before routing users to the new deployment.
5. Configure the Supabase Site URL and redirect allowlist with the real Vercel production domain.
6. Set a custom domain, HTTPS, backups, monitoring, and an incident contact before production use.

## Security baseline
- PostgreSQL RLS policies are the access-control boundary; never rely on hiding UI controls.
- Keep Supabase service-role and third-party API keys server-side only.
- Use strong unique passwords, email verification, MFA for administrators, least privilege, backups, and dependency updates.
- Configure rate limits and abuse monitoring. Do not upload real personal data until retention, consent, and privacy requirements have been reviewed.
- The included tests are starter checks; run a full security review and end-to-end tests before commercial launch.

## Roles
The database creates a profile for each authenticated user. The first administrator must be granted the role manually by a trusted database administrator after signup. Do not let users set their own role through signup metadata.


## Production scope notes
- This is an operational MVP foundation. Driver management UI, vehicle-to-driver assignment UI, GPS coordinate ingestion, delivery proof/signature capture, billing, and full audit logs are not included in this first build and must be added before selling as a fully featured fleet platform.
- SMS tracker initialization registers/activates a tracker record only. Real GPS location requires hardware that transmits a documented payload and a device-specific parser.
- Before production, add webhook idempotency using the Africa's Talking message ID, rate limits, admin audit trail, monitoring, and tests against the real provider sandbox.
# Trackfleet
