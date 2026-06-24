let bleDevice; // Store the connected device
let isConnecting = false; // Prevent multiple simultaneous connection attempts

const visemeParameters = [
  ['EnvelopeAttack', 2],
  ['EnvelopeRelease', 2],
  ['NoiseGateMultiplier', 2],
  ['NoiseFloorMin', 1],
  ['AHScale', 2],
  ['EEScale', 2],
  ['OHScale', 2],
  ['OOScale', 2],
  ['THScale', 2],
  ['LoudnessExponent', 2],
  ['LoudnessSmoothing', 2],
  ['LoudnessMax', 2],
  ['LoudnessMidBoost', 2]
];

const characteristicDefinitions = [
  ['eyeState', 'eyeState', true, { displayId: 'ble-eyestate' }],
  ['displayBrightness', 'display', true, { displayId: 'ble-brightness' }],
  ['viseme', 'viseme', true, { displayId: 'ble-viseme' }],
  ['mouthState', 'mouthState', true, { displayId: 'ble-mouthstate' }],
  ['hornLedBrightness', 'hornLedBrightness', true, { displayId: 'ble-hornled' }],
  ['cheekPanelBrightness', 'cheekPanelBrightness', true, { displayId: 'ble-cheekpanel' }],
  ['cheekBgColor', 'cheekBgColor', true, { displayId: 'ble-cheekbgcolor', isColor: true, throttleMs: 150 }],
  ['cheekFadeColor', 'cheekFadeColor', true, { displayId: 'ble-cheekfadecolor', isColor: true, throttleMs: 150 }],
  ['reboot', 'reboot', true],
  ['displayColorMode', 'displayColorMode', false, { displayId: 'ble-displaycolormode' }],
  ['displayEffectColor1', 'displayEffectColor1', false, { displayId: 'ble-displayeffectcolor1', isColor: true, throttleMs: 150 }],
  ['displayEffectColor2', 'displayEffectColor2', false, { displayId: 'ble-displayeffectcolor2', isColor: true, throttleMs: 150 }],
  ['displayEffectOption1', 'displayEffectOption1', false, { displayId: 'ble-displayeffectoption1' }],
  ['displayEffectOption2', 'displayEffectOption2', false, { displayId: 'ble-displayeffectoption2' }],
  ['displayEffectOption3', 'displayEffectOption3', false, { displayId: 'ble-displayeffectoption3' }],
  ['glitchTrigger', 'glitchTrigger', false, { isTrigger: true }],
  ['motionEnableFlags', 'motionEnableFlags', false, { displayId: 'ble-motionenableflags' }],
  ['tapSensitivity', 'tapSensitivity', false, { displayId: 'ble-tapsensitivity' }],
  ['glitchIntensity', 'glitchIntensity', false, { displayId: 'ble-glitchintensity' }],
  ['fanSpeed', 'fanSpeed', false, { displayId: 'ble-fanspeed' }],
  ...visemeParameters.map(([name]) => [`viseme${name}`, `viseme${name}`])
];

async function discoverCharacteristics(service) {
  for (const [name, uuidKey, required, options, notificationHandler] of characteristicDefinitions) {
    let characteristic;
    try {
      characteristic = await service.getCharacteristic(bleUUID.characteristic[uuidKey]);
    } catch (error) {
      if (required) throw error;
      console.warn(`${name} characteristic not available:`, error);
      continue;
    }

    bleManager.register(name, characteristic, options);
    console.log(`✓ ${name} characteristic found`);

    if (notificationHandler) {
      try {
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', notificationHandler);
        console.log(`✓ ${name} notifications enabled`);
      } catch (error) {
        console.warn(`Could not enable ${name} notifications:`, error);
      }
    }
  }
}

const readCharacteristic = name => bleManager.get(name)?.readValue();
window.writeBLE = (name, ...values) => bleManager.write(name, values.length === 1 ? values[0] : values);

//? Connect to a BLE device (new or existing)
async function connectToDevice(device, isReconnect = false, retryCount = 0) {
  // Prevent concurrent connection attempts
  if (isConnecting && retryCount === 0) {
    console.log('Connection already in progress, please wait...');
    throw new Error('Connection already in progress');
  }

  isConnecting = true;
  const MAX_RETRIES = 2;

  // Progress update helper
  const updateBLEProgress = (percent, text) => {
    if (typeof updateProgress === 'function') {
      updateProgress(percent, text);
    }
  };

  try {
    if (!isReconnect) {
      updateBLEProgress(50, retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : 'Connecting...');
    }

    // Check if already connected, if not connect
    let server;
    if (device.gatt && device.gatt.connected) {
      console.log('Device already connected');
      server = device.gatt;
    } else {
      console.log('Connecting to device...');

      // Ensure device GATT is available
      if (!device.gatt) {
        throw new Error('Device GATT not available');
      }

      server = await device.gatt.connect();

      // Small delay to let connection stabilize
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Verify connection before proceeding
    if (!server || !server.connected) {
      throw new Error('GATT Server disconnected after connection attempt');
    }

    console.log('Connected to GATT Server');

    if (!isReconnect) {
      updateBLEProgress(65, 'Loading...');
    }

    // Verify still connected before getting service
    if (!device.gatt || !device.gatt.connected) {
      throw new Error('Device disconnected before service retrieval');
    }

    const service = await server.getPrimaryService(bleUUID.service);

    console.log('Getting service...');
    if (!isReconnect) {
      updateBLEProgress(75, 'Syncing...');
    }

    await discoverCharacteristics(service);

    console.log('Reading value...');
    if (!isReconnect) {
      updateBLEProgress(90, 'Reading...');
    }

    const eyeStateValue = await readCharacteristic('eyeState');
    const displayBrightnessValue = await readCharacteristic('displayBrightness');
    const visemeValue = await readCharacteristic('viseme');
    const mouthStateValue = await readCharacteristic('mouthState');
    const hornLedBrightnessValue = await readCharacteristic('hornLedBrightness');
    const cheekPanelBrightnessValue = await readCharacteristic('cheekPanelBrightness');
    const cheekBgColorValue = await readCharacteristic('cheekBgColor');
    const cheekFadeColorValue = await readCharacteristic('cheekFadeColor');
    const displayColorModeValue = await readCharacteristic('displayColorMode');
    const displayEffectColor1Value = await readCharacteristic('displayEffectColor1');
    const displayEffectColor2Value = await readCharacteristic('displayEffectColor2');
    const displayEffectOption1Value = await readCharacteristic('displayEffectOption1');
    const displayEffectOption2Value = await readCharacteristic('displayEffectOption2');
    const displayEffectOption3Value = await readCharacteristic('displayEffectOption3');
    const motionEnableFlagsValue = await readCharacteristic('motionEnableFlags');
    const tapSensitivityValue = await readCharacteristic('tapSensitivity');
    const glitchIntensityValue = await readCharacteristic('glitchIntensity');
    const fanSpeedValue = await readCharacteristic('fanSpeed');

    for (const [suffix, decimals] of visemeParameters) {
      const name = `viseme${suffix}`;
      try {
        const value = await readCharacteristic(name);
        if (!value) continue;
        const floatValue = value.getFloat32(0, true);
        const slider = document.getElementById(`${name}Slider`);
        const display = document.getElementById(`${name}Value`);
        window.setVisemeParameterSlider?.(suffix, floatValue);
        if (display) display.textContent = floatValue.toFixed(decimals);
      } catch (error) {
        console.warn(`Could not read ${name}:`, error);
      }
    }

    console.log(`Eye state is ${eyeStateValue.getUint8(0)}`);
    console.log(`Display brightness is ${displayBrightnessValue.getUint8(0)}`);
    console.log(`Viseme value is ${visemeValue.getUint8(0)}`);
    console.log(`Mouth state is ${mouthStateValue.getUint8(0)}`);
    console.log(`Horn LED brightness is ${hornLedBrightnessValue.getUint8(0)}`);
    console.log(`Cheek Panel brightness is ${cheekPanelBrightnessValue.getUint8(0)}`);
    console.log(`Cheek BG Color: R=${cheekBgColorValue.getUint8(0)} G=${cheekBgColorValue.getUint8(1)} B=${cheekBgColorValue.getUint8(2)}`);
    console.log(`Cheek Fade Color: R=${cheekFadeColorValue.getUint8(0)} G=${cheekFadeColorValue.getUint8(1)} B=${cheekFadeColorValue.getUint8(2)}`);

    if (displayColorModeValue) {
      console.log(`Display Color Mode: ${displayColorModeValue.getUint8(0)}`);
    }
    if (displayEffectColor1Value) {
      console.log(`Display Effect Color 1: R=${displayEffectColor1Value.getUint8(0)} G=${displayEffectColor1Value.getUint8(1)} B=${displayEffectColor1Value.getUint8(2)}`);
    }
    if (displayEffectColor2Value) {
      console.log(`Display Effect Color 2: R=${displayEffectColor2Value.getUint8(0)} G=${displayEffectColor2Value.getUint8(1)} B=${displayEffectColor2Value.getUint8(2)}`);
    }
    if (displayEffectOption1Value) {
      console.log(`Display Effect Option 1: ${displayEffectOption1Value.getUint8(0)}`);
    }
    if (displayEffectOption2Value) {
      console.log(`Display Effect Option 2: ${displayEffectOption2Value.getUint8(0)}`);
    }
    if (motionEnableFlagsValue) {
      console.log(`Motion Enable Flags: 0x${motionEnableFlagsValue.getUint8(0).toString(16)}`);
    }
    if (tapSensitivityValue) {
      console.log(`Tap Sensitivity: ${tapSensitivityValue.getUint8(0)}`);
    }
    if (glitchIntensityValue) {
      console.log(`Glitch Intensity: ${glitchIntensityValue.getUint8(0)}`);
    }
    if (fanSpeedValue) {
      console.log(`Fan Speed: ${fanSpeedValue.getUint8(0)}%`);
    }

    if (!isReconnect) {
      updateBLEProgress(100, 'Connected!');
    }

    isStatusConnected(true);
    // Update device info in About page
    if (typeof updateDeviceInfo === 'function') {
      updateDeviceInfo(device);
    }
    // setBrightnessvalue(displayBrightnessValue.getUint8(0)); // Matrix brightness - Disabled
    setExpression(eyeStateValue.getUint8(0));
    window.bleVisemeValue = visemeValue.getUint8(0);
    window.setViseme?.(window.bleVisemeValue);
    setMouthState(mouthStateValue.getUint8(0));
    setHornLedBrightnessValue(hornLedBrightnessValue.getUint8(0));
    setCheekPanelBrightnessValue(cheekPanelBrightnessValue.getUint8(0));
    setCheekBgColorValue(cheekBgColorValue.getUint8(0), cheekBgColorValue.getUint8(1), cheekBgColorValue.getUint8(2));
    setCheekFadeColorValue(cheekFadeColorValue.getUint8(0), cheekFadeColorValue.getUint8(1), cheekFadeColorValue.getUint8(2));

    // Set Hub75 display color values only if available
    if (displayColorModeValue) {
      setDisplayColorModeValue(displayColorModeValue.getUint8(0));
    }
    if (displayEffectColor1Value) {
      setDisplayEffectColor1Value(displayEffectColor1Value.getUint8(0), displayEffectColor1Value.getUint8(1), displayEffectColor1Value.getUint8(2));
    }
    if (displayEffectColor2Value) {
      setDisplayEffectColor2Value(displayEffectColor2Value.getUint8(0), displayEffectColor2Value.getUint8(1), displayEffectColor2Value.getUint8(2));
    }
    if (displayEffectOption1Value) {
      setDisplayEffectOption1Value(displayEffectOption1Value.getUint8(0));
    }
    if (displayEffectOption2Value) {
      setDisplayEffectOption2Value(displayEffectOption2Value.getUint8(0));
    }
    if (displayEffectOption3Value) {
      setDisplayEffectOption3Value(displayEffectOption3Value.getUint8(0));
    }

    // Set Motion Detection & Glitch Control values only if available
    if (motionEnableFlagsValue) {
      setMotionEnableFlagsValue(motionEnableFlagsValue.getUint8(0));
    }
    if (tapSensitivityValue) {
      setTapSensitivityValue(tapSensitivityValue.getUint8(0));
    }
    if (glitchIntensityValue) {
      setGlitchIntensityValue(glitchIntensityValue.getUint8(0));
    }

    // Set Fan Control values only if available
    if (fanSpeedValue) {
      setFanSpeedValue(fanSpeedValue.getUint8(0));
    }

    // Show/hide fan control section based on availability
    if (typeof updateFanControlVisibility === 'function') {
      updateFanControlVisibility(Boolean(bleManager.get('fanSpeed')));
    }

    updateBLECharacteristicsDisplay(eyeStateValue.getUint8(0), displayBrightnessValue.getUint8(0), visemeValue.getUint8(0), mouthStateValue.getUint8(0), hornLedBrightnessValue.getUint8(0), cheekPanelBrightnessValue.getUint8(0), cheekBgColorValue, cheekFadeColorValue);

    // Connection successful - clear the flag
    isConnecting = false;

  } catch (error) {
    console.error('Error during BLE connection:', error);

    // Check if it's a disconnection error and we should retry
    const isDisconnectionError = /gatt server.*disconnect|device disconnected/i.test(error.message || '');

    if (isDisconnectionError && retryCount < MAX_RETRIES) {
      console.log(`Retry attempt ${retryCount + 1}/${MAX_RETRIES}`);

      // Wait before retrying (exponential backoff)
      const delayMs = 500 * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Retry the connection (don't clear isConnecting flag yet)
      return await connectToDevice(device, isReconnect, retryCount + 1);
    }

    // If we've exhausted retries or it's a different error, clear the flag
    isConnecting = false;

    if (isDisconnectionError) {
      console.log('Device disconnected during connection process - retries exhausted');
      if (!isReconnect && typeof updateProgress === 'function') {
        updateProgress(0, 'Connection Failed');
      }
    }

    // Re-throw the error to be handled by the caller
    throw error;
  }
}

async function startBLE() {
  try {
    // Progress update helper
    const updateBLEProgress = (percent, text) => {
      if (typeof updateProgress === 'function') {
        updateProgress(percent, text);
      }
    };

    updateBLEProgress(30, 'Searching...');

    if (await reconnectBLE()) return;

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [bleUUID.service] }],
    });

    bleDevice = device; // Store the device reference
    console.log(device.name);

    device.addEventListener('gattserverdisconnected', onDisconnected);

    // Use the shared connection function
    await connectToDevice(device, false);

  } catch (error) {
    // Silently handle user cancellation (when they close the pairing dialog)
    if (error.name === 'NotFoundError' && error.message?.includes('User cancelled the requestDevice() chooser')) {
      console.log('User cancelled device selection');
      return;
    }

    console.error('Error:', error);
    alert(error);
  }
}

async function reconnectBLE() {
  if (!navigator.bluetooth?.getDevices) return false;

  const devices = await navigator.bluetooth.getDevices();
  const device = devices.find(({ name }) => name === 'KMMX-Fursuit')
    || (devices.length === 1 ? devices[0] : null);
  if (!device) return false;

  bleDevice = device;
  device.addEventListener('gattserverdisconnected', onDisconnected);
  await connectToDevice(device, false);
  return true;
}
window.reconnectBLE = reconnectBLE;

function onDisconnected(event) {
  const device = event.target;
  console.log(`Device ${device.name} is disconnected.`);

  if (isConnecting) return;

  // Clear BLE Manager on disconnect
  bleManager.clear();

  isStatusConnected(false);
  updateBLECharacteristicsDisplay('-', '-', '-', '-', '-', '-', null, null);
  showDisconnectPopup();
}

// Viseme Advanced Parameters Characteristics
function writeVisemeFloat(name, value) {
  const decimals = visemeParameters.find(([suffix]) => name === `viseme${suffix}`)?.[1] ?? 2;
  const roundedValue = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setFloat32(0, roundedValue, true);
  bleManager.writeBuffer(name, buffer, roundedValue);
}

const throttledWrite = name => value => bleManager.getThrottledWrite(name)(value);
const throttledColorWrite = name => (r, g, b) => bleManager.getThrottledWrite(name)([r, g, b]);

const throttledAndDebouncedSetDisplayBrightness = throttledWrite('displayBrightness');
const throttledAndDebouncedSetHornLedBrightness = throttledWrite('hornLedBrightness');
const throttledAndDebouncedSetCheekPanelBrightness = throttledWrite('cheekPanelBrightness');
const throttledAndDebouncedSetCheekBgColor = throttledColorWrite('cheekBgColor');
const throttledAndDebouncedSetCheekFadeColor = throttledColorWrite('cheekFadeColor');
const throttledAndDebouncedSetDisplayEffectColor1 = throttledColorWrite('displayEffectColor1');
const throttledAndDebouncedSetDisplayEffectColor2 = throttledColorWrite('displayEffectColor2');
const throttledAndDebouncedSetDisplayEffectOption1 = throttledWrite('displayEffectOption1');
const throttledAndDebouncedSetDisplayEffectOption2 = throttledWrite('displayEffectOption2');
const throttledAndDebouncedSetDisplayEffectOption3 = throttledWrite('displayEffectOption3');
const throttledAndDebouncedSetTapSensitivity = throttledWrite('tapSensitivity');
const throttledAndDebouncedSetGlitchIntensity = throttledWrite('glitchIntensity');

const throttledVisemeFloatWriters = Object.fromEntries(visemeParameters.map(([name]) => [
  name,
  bleManager.throttleAndDebounce(value => writeVisemeFloat(`viseme${name}`, value), 100, 50)
]));
window.throttledVisemeFloatWriters = throttledVisemeFloatWriters;

// Update BLE characteristics display on About page
function updateBLECharacteristicsDisplay(eyeState, brightness, viseme, mouthState, hornLed, cheekPanel, cheekBgColor, cheekFadeColor) {
  updateBLECharValue('ble-eyestate', eyeState);
  updateBLECharValue('ble-brightness', brightness);
  updateBLECharValue('ble-viseme', viseme);
  updateBLECharValue('ble-mouthstate', mouthState);
  updateBLECharValue('ble-hornled', hornLed);
  updateBLECharValue('ble-cheekpanel', cheekPanel);

  if (cheekBgColor) {
    updateBLECharColorValue('ble-cheekbgcolor', cheekBgColor.getUint8(0), cheekBgColor.getUint8(1), cheekBgColor.getUint8(2));
  }
  if (cheekFadeColor) {
    updateBLECharColorValue('ble-cheekfadecolor', cheekFadeColor.getUint8(0), cheekFadeColor.getUint8(1), cheekFadeColor.getUint8(2));
  }
}

function updateBLECharValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

function updateBLECharColorValue(elementId, r, g, b) {
  const element = document.getElementById(elementId);
  if (element) {
    const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    element.textContent = hexColor.toUpperCase();
    element.style.color = hexColor;
  }
}

// Refresh BLE characteristics from device
async function refreshBLECharacteristics() {
  if (!bleDevice || !bleDevice.gatt.connected) {
    alert('Device not connected');
    return;
  }

  try {
    const refreshBtn = document.getElementById('refreshBleBtn');
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 6px; animation: spin 1s linear infinite;">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        Refreshing...
      `;
    }

    const eyeStateValue = await readCharacteristic('eyeState');
    const displayBrightnessValue = await readCharacteristic('displayBrightness');
    const visemeValue = await readCharacteristic('viseme');
    const mouthStateValue = await readCharacteristic('mouthState');
    const hornLedBrightnessValue = await readCharacteristic('hornLedBrightness');
    const cheekPanelBrightnessValue = await readCharacteristic('cheekPanelBrightness');
    const cheekBgColorValue = await readCharacteristic('cheekBgColor');
    const cheekFadeColorValue = await readCharacteristic('cheekFadeColor');
    const displayColorModeValue = await readCharacteristic('displayColorMode');
    const displayEffectColor1Value = await readCharacteristic('displayEffectColor1');
    const displayEffectColor2Value = await readCharacteristic('displayEffectColor2');
    const displayEffectOption1Value = await readCharacteristic('displayEffectOption1');
    const displayEffectOption2Value = await readCharacteristic('displayEffectOption2');
    const displayEffectOption3Value = await readCharacteristic('displayEffectOption3');

    updateBLECharacteristicsDisplay(
      eyeStateValue.getUint8(0),
      displayBrightnessValue.getUint8(0),
      visemeValue.getUint8(0),
      mouthStateValue.getUint8(0),
      hornLedBrightnessValue.getUint8(0),
      cheekPanelBrightnessValue.getUint8(0),
      cheekBgColorValue,
      cheekFadeColorValue
    );

    // Update display color characteristics in the UI only if available
    if (displayColorModeValue) {
      updateBLECharValue('ble-displaycolormode', displayColorModeValue.getUint8(0));
    }
    if (displayEffectColor1Value) {
      updateBLECharColorValue('ble-displayeffectcolor1', displayEffectColor1Value.getUint8(0), displayEffectColor1Value.getUint8(1), displayEffectColor1Value.getUint8(2));
    }
    if (displayEffectColor2Value) {
      updateBLECharColorValue('ble-displayeffectcolor2', displayEffectColor2Value.getUint8(0), displayEffectColor2Value.getUint8(1), displayEffectColor2Value.getUint8(2));
    }
    if (displayEffectOption1Value) {
      updateBLECharValue('ble-displayeffectoption1', displayEffectOption1Value.getUint8(0));
    }
    if (displayEffectOption2Value) {
      updateBLECharValue('ble-displayeffectoption2', displayEffectOption2Value.getUint8(0));
    }
    if (displayEffectOption3Value) {
      updateBLECharValue('ble-displayeffectoption3', displayEffectOption3Value.getUint8(0));
    }

    console.log('BLE characteristics refreshed');
    vibrateDevice();

    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 6px;">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        Refresh Values
      `;
    }
  } catch (error) {
    console.error('Error refreshing BLE characteristics:', error);
    alert('Failed to refresh characteristics: ' + error);

    const refreshBtn = document.getElementById('refreshBleBtn');
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 6px;">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        Refresh Values
      `;
    }
  }
}

// Reboot device
async function rebootDevice() {
  if (!bleDevice || !bleDevice.gatt.connected) {
    alert('Device not connected');
    return;
  }

  // Confirm before rebooting
  if (!confirm('Are you sure you want to reboot the device? This will disconnect and restart the device.')) {
    return;
  }

  try {
    const rebootBtn = document.getElementById('rebootDeviceBtn');
    if (rebootBtn) {
      rebootBtn.disabled = true;
      rebootBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 6px; animation: spin 1s linear infinite;">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        Rebooting...
      `;
    }

    // Write non-zero value to trigger reboot
    await bleManager.get('reboot').writeValue(Uint8Array.of(1));
    console.log('Reboot command sent to device');

    // Vibrate to confirm
    if (typeof vibrateDevice === 'function') {
      vibrateDevice('success');
    }

    // Reset button after a delay
    setTimeout(() => {
      if (rebootBtn) {
        rebootBtn.disabled = false;
        rebootBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 6px;">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Reboot Device
        `;
      }
    }, 3000);

  } catch (error) {
    console.error('Error rebooting device:', error);
    alert('Failed to reboot device: ' + error);

    const rebootBtn = document.getElementById('rebootDeviceBtn');
    if (rebootBtn) {
      rebootBtn.disabled = false;
      rebootBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 6px;">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        Reboot Device
      `;
    }
  }
}
