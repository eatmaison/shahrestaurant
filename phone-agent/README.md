# Shah phone assistant

Separate Node 22+ service; existing Next.js app stays the public storefront.

KPN existing number → forward to new Dutch Twilio voice number → Elastic SIP trunk → OpenAI Realtime → signed inbound webhook at https://shahrestaurant.nl/phone-ai/webhook → loopback Node service → shared PostgreSQL reservations.

The first sentence is “Goedendag, u spreekt met Shah Restaurant!” followed by AI disclosure. Default language Dutch; caller can choose English.

## Prepared, not activated

The service defaults to disabled. Missing credentials never result in a fake successful reservation or an answered AI call. No KPN change is performed by this project. Live audio/model quality and carrier routing require paid provider accounts and a real controlled test, which offline tests cannot establish.

Run npm ci and npm test. Tests use in-memory PGlite and mocked OpenAI call APIs; they never dial, send email or use paid models. Run npm run check to see configuration names/readiness only, never secret values.

Use python3 scripts/configure.py --prepare to generate a disabled config. Credentials are read server-side from ../.env.phone-agent and existing database/email settings from ../.env.local. The generated config is ignored by Git and has mode 0600.

Use python3 scripts/configure.py to enter credentials without enabling calls. Use --enable only when accounts, routing and spending settings are ready for controlled calls to the new number. PM2 process: shah-phone-agent. No public outbound-call endpoint is implemented.

## Reservation rules

The authoritative data is the existing reservations table, site=tandoor, shared with The Tandoor Company. Additive migration adds source=website for existing/website rows. AI bookings use source=phone_ai, and a note marker visible in every existing admin panel. New phone bookings are protected by a unique call-to-reservation mapping and one SQL transaction. Failed writes roll back.

The agent must prepare a draft, repeat its details and wait for a NEW positive caller transcription before saving it. Assistant text/tool arguments do not grant consent. A correction invalidates the confirmation and requires a new draft/read-back. Caller IDs are not trusted as verified contact numbers.

The restaurant manager explicitly confirms that tables are available. Therefore valid opening-hour reservations are automatically confirmed after caller consent by default, without mandatory per-day review or staff approval. This is a manager-authorized availability policy, not a claim that external calendars were checked live.

The admin can optionally enable a limit for a particular busy date. When enabled, its conservative maximum applies to the entire evening, 0–35 guests, not to each time slot; existing pending/confirmed/arrived website/AI guests and entered external guests count against it. Concurrent AI decisions serialize with a database lock and capacity is rechecked when saving. A full/blocked date or invalid hours do not create a confirmed booking. Restaurant dining Tue–Sun 15:00–22:00; Monday closed. Social Deal voucher bookings from 14:00 are handled on that platform.

This is NOT automatic synchronization with TheFork, Social Deal, walk-ins or other staff bookings. Staff maintain external counts only if they choose to enable a day limit. Existing website paths do not implement the optional AI day limit. The system does not promise prevention of all restaurant overbooking; its default follows the manager's explicit instruction to accept valid reservations.

## Email and privacy

Email is optional; a caller can book with a name and phone number alone. If email is requested, an existing Resend configuration is required. A transactionally created outbox sends the pending/confirmed receipt with the correct wording, a stable Resend idempotency key, bounded retries and no secrets/guest details in logs. The initial receipt is not an automatic notification of every later admin status change.

No raw call audio or full transcript is stored by this app. Final booking contact details remain in the shared reservations table; event/call IDs are retained for deduplication. OpenAI/Twilio have their own processing/retention settings, which must be reviewed when setting up their accounts. The app does not claim zero provider retention or automatically fulfilled privacy obligations.

## Operation

- One PM2 instance: SIP sideband ownership and concurrency are per process. A replica rollout would need distributed active-session ownership.
- Max duration, daily call count and concurrent calls are configurable; these are usage safeguards, not an exact monetary budget cap.
- Failed OpenAI or sideband connection ends/rejects the call. Set a carrier fallback and test it. No system can guarantee answering during all provider/internet outages.
- Human transfers use only one explicitly configured separate staff number. The existing forwarded KPN number and the AI number are rejected as transfer targets to prevent loops.
- Only signed OpenAI webhook events are public. Local admin endpoints use a generated bearer secret and Next.js admin authentication/CSRF checks.
- Phone bookings must be excluded from “website-only” growth reports using source='website'. Do not attribute phone_AI bookings to a specific website just from site=tandoor.

Official references:

- https://developers.openai.com/api/docs/guides/voice-sip?voice-api=realtime
- https://developers.openai.com/api/docs/guides/realtime-mcp
- https://developers.openai.com/api/docs/guides/webhooks
- https://www.twilio.com/en-us/blog/developers/tutorials/product/openai-realtime-api-elastic-sip-trunking
