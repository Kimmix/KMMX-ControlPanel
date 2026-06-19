# KMMX Control Panel

Progressive Web App for controlling the
[KMMX-Fursuit](https://github.com/Kimmix/KMMX-Fursuit) over Bluetooth Low
Energy.

## Run locally

Web Bluetooth requires Chrome, Edge, or Opera and a secure context.
`localhost` is accepted for development.

```bash
python -m http.server 8000
```

Open `http://localhost:8000`, tap the splash screen, and select the KMMX
device.

## Features

- Eye expressions and mouth states
- Audio-reactive viseme controls
- Display colors and effects
- Horn, cheek panel, motion, glitch, and fan controls
- Installable PWA with offline assets

## Structure

```text
KMMX-ControlPanel/
├── index.html
├── manifest.json
├── sw.js
├── src/
│   ├── components/
│   ├── config/
│   ├── core/
│   ├── managers/
│   └── utils/
└── asset/
    ├── css/
    └── svg/
```

BLE UUIDs are defined in `src/config/ble-config.js`. The protocol is
documented in `BLE_INTERFACE.md`.

Live app: [kimmix-control.anthro.asia](https://kimmix-control.anthro.asia)

Copyright © 2023 Kimmix. Authorized use only.
