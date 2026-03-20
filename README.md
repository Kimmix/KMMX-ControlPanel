# KMMX Control Panel

A Progressive Web App (PWA) for controlling the [KMMX-Fursuit](https://github.com/Kimmix/KMMX-Fursuit) protogen via Bluetooth Low Energy (BLE). This web-based control panel provides an intuitive interface for managing facial expressions, viseme animations, and display settings on the fursuit in real-time.

> **Related Project**: This controller is designed for the [KMMX-Fursuit](https://github.com/Kimmix/KMMX-Fursuit) - an ESP32-based protogen fursuit with animated LED matrix displays, audio-reactive visemes, and interactive features.

## 🚀 Getting Started

### Prerequisites

- A modern web browser with Web Bluetooth API support (Chrome, Edge, or Opera recommended)
- A [KMMX-Fursuit](https://github.com/Kimmix/KMMX-Fursuit) device running the ESP32 firmware
- HTTPS connection (required for Web Bluetooth API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kimmix/KMMX-ControlPanel.git
   cd KMMX-ControlPanel
   ```

2. **Serve the application**

   You can use any static file server. For example:

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js http-server
   npx http-server

   # Using PHP
   php -S localhost:8000
   ```

3. **Access the application**

   Open your browser and navigate to `https://localhost:8000` (or your server address)

### Installing as PWA

1. Open the application in a supported mobile browser
2. Tap the browser menu and select "Add to Home Screen" or "Install App"
3. The app will be installed and can be launched like a native application

## 📱 Usage

1. **Connect to Device**
   - Tap the splash screen to initiate BLE pairing
   - Select your KMMX-Fursuit device from the browser's Bluetooth pairing dialog
   - Wait for the connection to establish

2. **Control Expressions**
   - Browse available facial expressions in the Expression section
   - Tap an expression button to activate it on the fursuit
   - The current expression is displayed at the top

3. **Manage Viseme**
   - Toggle viseme (mouth) animation on/off using the dedicated button
   - Adjust viseme intensity using the slider (when enabled)
   - Viseme animations respond to audio input on the fursuit

4. **Adjust Brightness**
   - Use the brightness slider at the bottom to control LED matrix brightness
   - Visual dots indicate the current brightness level

5. **Monitor Connection**
   - Check the status pill (top-right) for connection state
   - View connection duration in the footer
   - Green pulsing pill = Connected
   - Red pill = Disconnected

## 🏗️ Project Structure

```
KMMX-ControlPanel/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── app.js                  # Core application logic
├── ble.js                  # Bluetooth Low Energy handlers
├── control.js              # UI control logic
├── carousel.js             # Carousel functionality (optional)
├── favicon.png             # App icon
├── icon-pwa.png            # PWA icon
├── CNAME                   # Custom domain configuration
└── asset/
    ├── css/                # Stylesheets
    │   ├── normalize.css
    │   ├── styles-main.css
    │   ├── splash.css
    │   └── control-panel.css
    ├── svg/                # SVG assets
    └── maskable_icon.png   # Maskable PWA icon
```

## 🔧 Technical Details

### BLE Service Configuration

The control panel communicates with the KMMX-Fursuit using the following BLE service:

- **Service UUID**: `c1449275-bf34-40ab-979d-e34a1fdbb129`
- **Characteristics**:
  - Display Brightness: `9fdfd124-966b-44f7-8331-778c4d1512fc`
  - Eye State (Expressions): `49a36bb2-1c66-4e5c-8ff3-28e55a64beb3`
  - Viseme (Mouth Animation): `493d06f3-0fa0-4a90-88f1-ebaed0da9b80`

### Browser Compatibility

- ✅ Chrome/Chromium (Desktop & Mobile)
- ✅ Microsoft Edge
- ✅ Opera
- ❌ Firefox (Web Bluetooth not supported)
- ❌ Safari (Web Bluetooth not supported)

## 🎨 Customization

The application uses CSS custom properties for theming. Key colors can be modified in the CSS files:

- Primary accent: `#f9826c`
- Background: `#0b0b0c`
- Connected status: `#94ca5b`
- Disconnected status: `#cb203f`

## 🔒 Security

This application is designed for **authorized use only**. The Web Bluetooth API requires:
- User gesture to initiate pairing
- HTTPS connection (except localhost)
- Explicit user permission for device access

## 🦊 Related Projects

- **[KMMX-Fursuit](https://github.com/Kimmix/KMMX-Fursuit)** - The main ESP32 firmware for the protogen fursuit
  - Animated LED matrix displays for eyes and mouth
  - Audio-reactive visemes
  - Proximity sensing and accelerometer integration
  - Bluetooth connectivity

## 📄 License

Copyright © 2023 Kimmix. All rights reserved.
**Authorized use only.**

## 🤝 Contributing

This is a proprietary project. Contributions are restricted to authorized personnel only.

---

**Live Demo**: [kimmix-control.anthro.asia](https://kimmix-control.anthro.asia)

