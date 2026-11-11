# Local review workflow

The owner requested on 10 November 2026 that future website changes are shown on localhost first. Do not deploy to a live domain or push an update for publication until the owner explicitly requests it after review.

Current verified review (11 November 2026): http://localhost:3398/ . This is the read-only production preview with the checked-in public seed catalogue. See [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md) for exact start commands, build identity, test results and data limitations. The unchanged v4 film still fully prebuffers before cinematic scrubbing, while the picture and page remain available; the blocking loading gate has been removed. Chromium prewarms off-DOM and attaches a decoded frame when scrolling needs it. WebKit retains its native warmup path; real iPhone testing remains pending.

Historical 10 November design preview: http://localhost:3395/ . On an iPhone on the same WiFi: http://192.168.2.130:3395/ .

The running preview is an isolated, read-only build with public menu data. Its temporary API fixtures/proxy are not product changes and must never be published. The real project keeps its existing database settings.

HQ hero files are v4: desktop 1920x1080; portrait 608x1080. The earlier loading gate waited for complete download and decoder preparation. WebKit uses native MP4 after the download, including end/start decoder warmup; other browsers use the fully downloaded Blob. Scroll seeking deduplicates repeated targets. Reduced motion/data saver show a native-resolution still.
