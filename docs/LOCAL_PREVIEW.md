# Local review workflow

The current public redesign runs at **http://localhost:3398/**. It is left running. Build `Hj2ubUjCMfbacacwFligZ`, Webpack / Next.js16.2.10, `.next-review-cookie-ssr-20261111`, source `1b9a194de54237b2104232c89ce249729ddd466a648d819a1118bcd81717fc62` (418 inputs). The older Ewy/104-item-seed preview was replaced after its exact process/port identities were verified. No deployment or publication occurred.

The main preview is a GET/HEAD-only proxy on3398 over the isolated Next app on3397. It serves the actual captured public catalogue (224 products/two brands), with a fixed restaurant-status clock and no private data. Bookings, checkout and account mutations are disabled. Gallery fixture v2 explicitly supplies no administrator uploads; ten supplied restaurant photographs remain. It is not a live operational restaurant-data preview.

## Exact start/check command

From the repository in PowerShell:

```powershell
$env:QA_REVIEW_CANDIDATE = '0'
node "$env:TEMP\shah-preview-20261111\start-cookie-ssr-review.cjs"
```

This command was checked against the running final build. It verifies the pinned build, public assets/runtime configuration, transport/proxy hashes and catalogue integrity. If the matching preview already runs, it prints the verified URL and exits. It does not rebuild, stop an unknown process, publish or submit a transaction. Both main ports must be free if no matching preview is running; do not stop arbitrary processes to free them.

This frozen-review helper, captured fixture and raw QA files are local to this computer under Temp. Preserve them together with `.next-review-cookie-ssr-20261111` to reproduce this exact review. Their loss requires reconstructing a new guarded review; the command is not a portable deployment recipe. Environment files were not edited and no secrets are stored in the helper.

The same artifact/fixture used for final tests is also available at http://localhost:3518/ over its direct app3517. This candidate is separate from the established main URL. The parent's older event-review server3482 was preserved.

## Public routes

- Dutch core: `/`, `/menukaart`, `/reserveren`, `/privacy`, `/voorwaarden`.
- English core: `/en`, `/en/menu`, `/en/reservations`, `/en/privacy`, `/en/terms`.
- Public events: `/events`, `/events/about`, `/events/birthdays`, `/events/celebrations`, `/events/company-catering`, `/events/company-lunches`, `/events/gallery`.
- `/parties` and nested private pages/APIs remain administrator-only. The read-only fixture does not provide an admin account.

Seven separate English event URLs are not implemented. Event pages start consistently in Dutch on a cold visit; explicit English interface choices work during navigation.

## Editing source

For an ordinary development build in a fresh terminal:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3395
```

Development mode is separate from the measured frozen build and its read-only data proxy. The production measurements use the installed CLI's `next build --webpack` through `SHAH_REVIEW_DIST_DIR` and an isolated TypeScript configuration; normal `npm run build` selects the framework default compiler. Do not compare development indicators or hot-reload timing to the recorded production results.

Design details: [CINEMATIC-REVISION.md](CINEMATIC-REVISION.md). Exact results and unmet requirements: [CINEMATIC-FINAL-VERIFICATION.md](CINEMATIC-FINAL-VERIFICATION.md). The owner requested localhost review before any publication; no production change is authorized by this document.