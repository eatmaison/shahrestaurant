# Phone preview on the local network

Current preview: http://192.168.0.122:3618/ (Dutch) and http://192.168.0.122:3618/en (English), build `xAq9sMM06TxZlpVjSRdv3`, source `c5dfe68d113f96ab7cd28782fd427392cf2002332990b14ad4b06cb993b1cd62`, 496 inputs. Same build at localhost:3398, including gold light mode and larger header navigation. Fresh PC-side LAN checks passed 56 policy, 60 public asset HEADs, 17 route guards, three fixture APIs and four media ranges. The exact public optional-consent chunk is allowed; private dynamic assets and all submissions remain blocked. No network-security settings changed. [Current handoff and commands](ADMIN-PLUS50.md), [LAN evidence](phone-preview-2026-11-11.json).

Admin previews are **loopback-only** at http://localhost:4068/admin and its customers/stats/events pages, using labelled invented data. The LAN listener does not expose them. The approved photographs and bilingual intro remain included. Current mobile checks use desktop browser emulation/PC-side LAN requests; no fresh physical-phone result is claimed.

Current start/verify command:

```powershell
node "$env:TEMP\shah-phone-preview-20261111\launch-lan-nl-v2-detached.cjs" "$env:TEMP\shah-phone-preview-20261111\lan-config-xAq9sMM06TxZlpVjSRdv3.json"
```

## Historical 12 November baseline and policy explanation

Open **http://192.168.0.122:3618/** on the phone, or **http://192.168.0.122:3618/en** for English. The phone must be on the router's same local network as this PC; guest Wi-Fi isolation or VPN LAN filtering may prevent access.

The PC's physical Ethernet adapter has `192.168.0.122/24`; `10.2.0.2` belongs to ProtonVPN and is not the phone address. The listener binds only `192.168.0.122:3618` and accepts peers from `192.168.0.0/24`. Local-interface GETs of `/` and `/en` returned 200 with promoted build `6zD0ge5SdqAm0X_krXcdr`, source `c932fd7a1cbe84c52ab2e1e3d2669b143efcf918c8d252a1322e95e441c4fb71` (551 inputs).

**For the preceding KIb4 build, the user confirmed physical-phone playback:** asked “Does http://192.168.0.122:3618/ open on your phone on the same Wi-Fi, and does the video play after buffering?”, they answered **“Yes, the video plays”**. This is a direct user report, separate from the PC-side HTTP checks. The phone model, operating system and actual frame rate were not recorded or measured. The current bilingual release has fresh PC-side LAN verification; a new physical-phone result has not yet been reported.

The proxy is deliberately view-only: 24 public pages, their approved assets and videos, the pinned 224-product/two-brand catalog, public restaurant status and an empty uploaded gallery. Local cart changes remain local. Account, admin, terminal, private parties, auth, payment, recovery and test routes return 404. All submissions return 405; other APIs return 503. Session cookies, Authorization and forwarded identity headers do not reach the upstream; response Set-Cookie is removed. No filesystem browser, directory listing, public tunnel or deployment is provided.

The existing localhost preview at `http://localhost:3398/` remains the fixed upstream. Its approved build must be running before the phone listener can start. To start the detached phone listener (an already running matching listener is left unchanged):

```powershell
node "C:/Users/DaviiC/AppData/Local/Temp/shah-phone-preview-20261111/launch-lan-nl-v2-detached.cjs" "C:/Users/DaviiC/AppData/Local/Temp/shah-phone-preview-20261111/lan-config-6zD0ge5SdqAm0X_krXcdr.json"
```

The current listener PID is **44944**, launched hidden/detached with stdout/stderr logs. Its exact command, executable, creation time and binding are retained in `C:/Users/DaviiC/AppData/Local/Temp/shah-phone-preview-20261111/active-detached-lan.json` and its stop manifest. Only the verified task-owned previous listener PID49736 was stopped for this promotion. The old policy helper remains unchanged for its historical ownership checks; this release uses the versioned `lan-preview-nl-v2.cjs`, SHA-256 `62f0381b8153fd31b6f662177fcc0e9e7234e23a788742d8a513f71925f54f8f`. The active config SHA-256 is `3e5052adf081fcd37ee2e6dfa20003d5896b923d6d148666e5181c02e3303423`.

At 2026-11-12T00:06:36Z, a read-only recovery check found no listener on 3618; the former PID 26844 belonged to Chrome and **was not stopped**. Why the former listener exited was not established. Recovery started a new task-owned listener without stopping any process or changing security settings. Unknown busy-port listeners are never replaced. If the DHCP address changes, re-check the interface and configuration.

Windows currently classifies Ethernet as **Public**. Firewall is enabled with default BlockInbound; existing Node.js Public-profile application allow rules were found by read-only inspection. **No firewall rule, network profile, VPN or router setting was changed.** If phone access is blocked, further diagnosis is needed; a security setting change requires explicit confirmation at action time. A Private-only firewall rule would not apply while this adapter remains Public.

The [verification record](phone-preview-2026-11-11.json) records **56 policy checks, 58 public Next asset HEAD checks, 17 public/private/master/write HTTP checks, three guest-only fixture APIs and four MP4 Range/prefix checks**, all passed. Four approved delivery paths are allowed and three additional master/legacy paths were explicitly denied. Both new Dutch complete video bodies were also streamed through the LAN proxy and matched approved hashes (14,767,612 B mobile; 21,595,932 B desktop). The English full-body hashes are carried only after unchanged frozen-media identity, with fresh Range checks. The exact allowlist is **two Dutch and two English deliveries**, with matching posters; master/private files remain unavailable.

Independent v2 review confirmed the helper hash, exact four deliveries, fixed binding/upstream and unchanged route/subnet/status guard functions, with no finding. No firewall, profile, VPN or router setting changed. The only physical-phone playback confirmation remains the prior KIb4 user report; this final release has PC-side LAN/transport checks and no new physical-device, OS or actual-FPS claim.

The 12 November workspace/sidebar promotion keeps private synthetic account/admin previews loopback-only. [Workspace evidence and limitations](WORKSPACE-UI-VERIFICATION.md).
