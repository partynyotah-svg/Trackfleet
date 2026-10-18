# Africa's Talking SMS tracker initialization

## What this feature does (and does not do)
The SMS endpoint initializes a TrackFleet tracker record after validating a command, a registered sender SIM phone number, the vehicle plate, and a one-time initialization code. It records initialization time and an event. **It does not obtain GPS coordinates from an ordinary SMS or magically communicate with arbitrary GPS hardware.** To receive real positions, the tracker hardware must send a documented location payload via SMS or HTTP, and a separate parser/endpoint must be implemented for that device protocol.

## Command format
`INIT TRACKER_CODE VEHICLE_PLATE ONE_TIME_CODE`
Example with dummy values: `INIT TRK-001 KDA123A A_LONG_RANDOM_ONE_TIME_CODE`
Send from the exact phone number stored in `vehicles.tracker_phone`. Normalize Kenyan mobile numbers to E.164 format such as `+2547...`. The one-time code is consumed on successful initialization.

## Provider setup
1. Create an Africa's Talking account and configure SMS access for the correct environment (sandbox for testing, live only after approval and funding).
2. Set `AT_USERNAME`, `AT_API_KEY`, and optionally `AT_SENDER_ID` in local `.env.local` and Vercel Project Settings. The API key is a server-only secret.
3. Set a long random `AT_WEBHOOK_TOKEN`. Never use a short predictable token.
4. Configure the incoming SMS callback URL in the Africa's Talking dashboard to:
   `https://YOUR-DEPLOYMENT.vercel.app/api/at/sms?token=YOUR_RANDOM_WEBHOOK_TOKEN`
   For local tests use a public HTTPS tunnel; Africa's Talking cannot call localhost directly.
5. Apply the Supabase migration first. Register a vehicle with `tracker_code`, `tracker_phone`, and the SHA-256 hash of a random one-time code in `tracker_init_pin_hash`.
6. Generate the hash locally: `node scripts/hash-init-code.mjs 'YOUR_RANDOM_CODE'`. Insert the hash into the vehicle row through an authorized admin SQL session. Do not store the raw code in a ticket, chat, or log.
7. Test only with a controlled number and sandbox. Check provider callback logs and Supabase tracker_events. Confirm the code cannot be reused.
8. For production, use an approved sender/shortcode where required, provider delivery reports, rate limiting, monitoring, and a periodic secret rotation process.

## Security notes
- The callback uses a token in the URL because provider webhook signatures may not be available for every account/setup. Treat the full callback URL as a secret. Rotate it if exposed.
- Provider callback retry behaviour can cause duplicate delivery; the one-time update is guarded by an uninitialized-row condition, but production should add provider message ID idempotency and a durable event queue.
- This starter uses a privileged server-side database key in the webhook route. Keep it in Vercel server-only environment variables and restrict who can edit deployment environment variables.
- SMS is not encrypted end-to-end; never send passwords, personal documents, or long-term secrets by SMS.
- Verify current Africa's Talking dashboard settings and official API docs for your account/region before going live.
