# TrackFleet operations checklist
- Assign `admin` role to a trusted first admin using Supabase SQL Editor after that person signs up: `update public.profiles set role='admin' where id='AUTH_USER_UUID';`
- Do not expose the service-role key to browsers.
- Before using live GPS, confirm the tracker hardware's message format, SIM ownership, GPS permissions, and legal basis for tracking drivers/vehicles.
- Add per-user audit logs, delivery proof, export controls, and operational alerting before a paid production launch.
- Validate every SMS sender against the registered tracker SIM and keep a support process for SIM swaps.
