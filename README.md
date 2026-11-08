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

## Lip sync tuning

The audio settings page offers fixed Noise rejection (1–1,000 RMS), independent
Mouth size (0.25–4×), and Snappy/Natural/Smooth response. Response presets adjust timing only. Calibrate Room measures a
fixed threshold after a quiet countdown; stay silent for the full four seconds.
Speaking during calibration can set the threshold too high. Cancel or failure keeps
the previous settings. Booping and disconnecting the browser do not erase calibration.

Settings apply live and last until the controller restarts. Reboot restores threshold
13, mouth size 1×, and Natural response. Boops and BLE reconnects preserve current
RAM settings. Previously stored tuning is ignored; no viseme settings are saved to flash.
The panel reads device settings on reconnect and shows microphone/calibration failures.

New tuning requires 10-byte settings v2 and status v3, with the matching updated panel. Old/unsupported firmware retains
basic controls and shows an update message. An old panel on new firmware retains
lip-sync on/off and other basic controls, but its old tuning sliders are unsupported.
Update both panel and firmware to use tuning. Refresh when the installed PWA shows
an update notice. No settings are migrated from the old RAM-only adaptive system.

Run `node --test tests/*.test.cjs` for session settings, status decoding, and panel
feedback checks (Node 24 or newer; no package installation). See
[BLE_INTERFACE.md](BLE_INTERFACE.md) for byte layouts and compatibility.
