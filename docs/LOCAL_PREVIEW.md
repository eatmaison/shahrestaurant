# Local review workflow

The owner requested on 10 November 2026 that future website changes are shown on localhost first. Do not deploy to a live domain or push an update for publication until the owner explicitly requests it after review.

Current design preview: http://localhost:3395/ . On an iPhone on the same WiFi: http://192.168.2.130:3395/ .

The running preview is an isolated, read-only build with public menu data. Its temporary API fixtures/proxy are not product changes and must never be published. The real project keeps its existing database settings.

HQ hero files are v4: desktop 1920x1080; portrait 608x1080. The loading gate waits for complete download and decoder preparation. WebKit uses native MP4 after the download, including end/start decoder warmup; other browsers use the fully downloaded Blob. Scroll seeking deduplicates repeated targets. Reduced motion/data saver show a native-resolution still.
