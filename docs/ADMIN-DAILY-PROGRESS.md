# Admin Daily progress range correction

Local-only change, 11 November 2026. No deployment or database modification.

## Behavior

- All time starts on the Amsterdam calendar day of the earliest received order, including an unpaid first order, and continues through today. It does not reuse the 30-day window.
- Each day in the selected period is present, including zero-order days. No orders at all produces the existing empty chart message.
- The statistics and order-management filters both have independent From and To date inputs. Both dates are included. Partial, invalid and reversed ranges show a message and do not silently fall back to All time.
- Today, 7-day and 30-day filters use Amsterdam calendar days, including today. Summary totals and chart buckets share the same boundaries. The clock refreshes every minute.
- Paid personal orders and company orders retain the existing revenue/counting rule. The oldest received order determines the beginning of history even when that order itself is not counted as revenue.
- Long charts retain every daily point and scroll horizontally. Labels and tooltips include the year.

## Data completeness and performance

Admin `loadOrders()` has no order LIMIT or pagination, and Providers passes the complete array to the admin page. No server query change was needed. Aggregation is linear in orders plus calendar days and reuses a cached Amsterdam date formatter.

Synthetic performance test: 100,000 orders across 3,602 daily buckets completed in approximately 0.4–0.6 seconds on the connected desktop. No records were read from or written to the production database for these checks.

## Verification

- `node scripts/test-admin-metrics.cjs`: passed, also with `TZ=America/Los_Angeles` and `TZ=Asia/Tokyo`. Covers full history, presets, empty periods, invalid/incomplete/reversed ranges, exact boundaries on Amsterdam 23/25-hour DST days, midnight refresh, totals parity and 100,000 rows.
- `node scripts/test-admin-chart-ui.cjs`: passed. Uses the real chart and range JSX in isolated React rendering/event fixtures. Covers 316 daily points, year labels, empty/single-day rendering, both localized date inputs, independent start/end changes, clearing, invalid status and reset to All time. This is not browser interaction testing.
- `npx tsc --noEmit --incremental false`: passed.
- Focused ESLint: no errors, one existing unused `index` warning in the admin page.
- Full repository ESLint: 22 unrelated errors in terminal/page.tsx, phone-agent/test/realtime.test.mjs, and existing delete/seed/brand-name/email test scripts. These unrelated files were not changed by this task.
- Isolated Next.js webpack production build passed with a loopback-only dummy DATABASE_URL. Existing previews and production were not replaced.
- Browser visual/interaction verification was blocked: Windows Computer Use could not confidently determine Chrome's current URL and required automation to stop. No alternate UI control route was used.

## Review fixture

http://localhost:3472/admin is a loopback-only synthetic admin preview. It contains invented orders and visitors, not real business statistics. It blocks API writes and intercepts all API reads. The preview helper is temporary and is not part of production application code.

## Changed application files

- app/lib/adminMetrics.ts
- app/admin/page.tsx (chart and period-filter sections only; concurrent Recently Online edits preserved)
- app/lib/translations.ts (date-filter keys only; concurrent Recently Online keys preserved)
- scripts/test-admin-metrics.cjs
- scripts/test-admin-chart-ui.cjs

Final combined build: LyBv9TQ4Hox6Iwpe-0VgE in .next-review-admin-final-20261111. Source fingerprint: 6cb3da24e5bac9db6edcdb2d602e9cf2d907d36132c89436f14012fc6b573ed2. Source files were verified unchanged after the build. All 20 guest-recognition regression cases also passed.
