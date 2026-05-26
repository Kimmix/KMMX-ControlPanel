const bleUUID = {
  name: "KMMX-BLE",
  service: "c1449275-bf34-40ab-979d-e34a1fdbb129",
  characteristic : {
    display: "9fdfd124-966b-44f7-8331-778c4d1512fc",
    eyeState: "49a36bb2-1c66-4e5c-8ff3-28e55a64beb3",
    viseme: "493d06f3-0fa0-4a90-88f1-ebaed0da9b80",
    mouthState: "f6a7b8c9-d0e1-4f5a-b1c2-3d4e5f6a7b8c",
    hornLedBrightness: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    cheekPanelBrightness: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
    cheekBgColor: "c3d4e5f6-a7b8-4c5d-9e0f-1a2b3c4d5e6f",
    cheekFadeColor: "d4e5f6a7-b8c9-4d5e-9f0a-1b2c3d4e5f6a",
    reboot: "e5f6a7b8-c9d0-4e5f-a0b1-2c3d4e5f6a7b",
    displayColorMode: "f5a6b7c8-d9e0-4f5a-b0c1-2d3e4f5a6b7c",
    displayEffectColor1: "a6b7c8d9-e0f1-4a5b-c1d2-3e4f5a6b7c8d",
    displayEffectColor2: "b7c8d9e0-f1a2-4b5c-d2e3-4f5a6b7c8d9e",
    displayEffectOption1: "c7d8e9f0-a1b2-4c5d-e2f3-4a5b6c7d8e9f",
    displayEffectOption2: "e7f8a9b0-c1d2-4e5f-a2b3-4c5d6e7f8a9b",
    displayEffectOption3: "f7a8b9c0-d1e2-4f5a-b2c3-4d5e6f7a8b9c",
    glitchTrigger: "a1a2a3a4-b1b2-4c1c-d1d2-e1e2e3e4e5f1",
    motionEnableFlags: "a1a2a3a4-b1b2-4c1c-d1d2-e1e2e3e4e5f2",
    tapSensitivity: "a1a2a3a4-b1b2-4c1c-d1d2-e1e2e3e4e5f3",
    glitchIntensity: "a1a2a3a4-b1b2-4c1c-d1d2-e1e2e3e4e5f4"
  }
};

let eyeStateCharacteristic;
let displayBrightnessCharacteristic;
let visemeCharacteristic;
let mouthStateCharacteristic;
let hornLedBrightnessCharacteristic;
let cheekPanelBrightnessCharacteristic;
let cheekBgColorCharacteristic;
let cheekFadeColorCharacteristic;
let rebootCharacteristic;
let displayColorModeCharacteristic;
let displayEffectColor1Characteristic;
let displayEffectColor2Characteristic;
let displayEffectOption1Characteristic;
let displayEffectOption2Characteristic;
let displayEffectOption3Characteristic;
let glitchTriggerCharacteristic;
let motionEnableFlagsCharacteristic;
let tapSensitivityCharacteristic;
let glitchIntensityCharacteristic;
let bleDevice; // Store the connected device

// BLE Write Queue to prevent "GATT operation already in progress" errors
let bleWriteQueue = [];
let isProcessingBleWrite = false;

async function processBleWriteQueue() {
  if (isProcessingBleWrite || bleWriteQueue.length === 0) {
    return;
  }

  isProcessingBleWrite = true;

  while (bleWriteQueue.length > 0) {
    const writeOperation = bleWriteQueue.shift();
    try {
      await writeOperation();
    } catch (error) {
      console.error('BLE write error:', error);
    }
    // Delay between operations to prevent GATT conflicts
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  isProcessingBleWrite = false;
}

function queueBleWrite(writeFunction) {
  bleWriteQueue.push(writeFunction);
  processBleWriteQueue();
}

//? Connect to a BLE device (new or existing)
async function connectToDevice(device, isReconnect = false) {
  // Progress update helper
  const updateBLEProgress = (percent, text) => {
    if (typeof updateProgress === 'function') {
      updateProgress(percent, text);
    }
  };

  if (!isReconnect) {
    updateBLEProgress(50, 'Connecting...');
  }

  // Check if already connected, if not connect
  let server;
  if (device.gatt.connected) {
    console.log('Device already connected');
    server = device.gatt;
  } else {
    console.log('Connecting to device...');
    server = await device.gatt.connect();
  }

  console.log('Connected to GATT Server');

  if (!isReconnect) {
    updateBLEProgress(65, 'Loading...');
  }

  const service = await server.getPrimaryService(bleUUID.service);

  console.log('Getting service...');
  if (!isReconnect) {
    updateBLEProgress(75, 'Syncing...');
  }

  eyeStateCharacteristic = await service.getCharacteristic(bleUUID.characteristic.eyeState);
  displayBrightnessCharacteristic = await service.getCharacteristic(bleUUID.characteristic.display);
  visemeCharacteristic = await service.getCharacteristic(bleUUID.characteristic.viseme);
  mouthStateCharacteristic = await service.getCharacteristic(bleUUID.characteristic.mouthState);
  hornLedBrightnessCharacteristic = await service.getCharacteristic(bleUUID.characteristic.hornLedBrightness);
  cheekPanelBrightnessCharacteristic = await service.getCharacteristic(bleUUID.characteristic.cheekPanelBrightness);
  cheekBgColorCharacteristic = await service.getCharacteristic(bleUUID.characteristic.cheekBgColor);
  cheekFadeColorCharacteristic = await service.getCharacteristic(bleUUID.characteristic.cheekFadeColor);
  rebootCharacteristic = await service.getCharacteristic(bleUUID.characteristic.reboot);

  // Try to get new Hub75 display color characteristics (may not exist on older firmware)
  try {
    displayColorModeCharacteristic = await service.getCharacteristic(bleUUID.characteristic.displayColorMode);
    console.log('Hub75 Display Color Mode characteristic found');
  } catch (error) {
    console.warn('Hub75 Display Color Mode characteristic not available on this device');
    displayColorModeCharacteristic = null;
  }

  try {
    displayEffectColor1Characteristic = await service.getCharacteristic(bleUUID.characteristic.displayEffectColor1);
    console.log('Hub75 Display Effect Color 1 characteristic found');
  } catch (error) {
    console.warn('Hub75 Display Effect Color 1 characteristic not available on this device');
    displayEffectColor1Characteristic = null;
  }

  try {
    displayEffectColor2Characteristic = await service.getCharacteristic(bleUUID.characteristic.displayEffectColor2);
    console.log('Hub75 Display Effect Color 2 characteristic found');
  } catch (error) {
    console.warn('Hub75 Display Effect Color 2 characteristic not available on this device');
    displayEffectColor2Characteristic = null;
  }

  try {
    displayEffectOption1Characteristic = await service.getCharacteristic(bleUUID.characteristic.displayEffectOption1);
    console.log('Hub75 Display Effect Option 1 characteristic found');
  } catch (error) {
    console.warn('Hub75 Display Effect Option 1 characteristic not available on this device');
    displayEffectOption1Characteristic = null;
  }

  try {
    displayEffectOption2Characteristic = await service.getCharacteristic(bleUUID.characteristic.displayEffectOption2);
    console.log('Hub75 Display Effect Option 2 characteristic found');
  } catch (error) {
    console.warn('Hub75 Display Effect Option 2 characteristic not available on this device');
    displayEffectOption2Characteristic = null;
  }

  try {
    displayEffectOption3Characteristic = await service.getCharacteristic(bleUUID.characteristic.displayEffectOption3);
    console.log('Hub75 Display Effect Option 3 characteristic found');
  } catch (error) {
    console.warn('Hub75 Display Effect Option 3 characteristic not available on this device');
    displayEffectOption3Characteristic = null;
  }

  // Try to get new Motion Detection & Glitch Control characteristics (may not exist on older firmware)
  try {
    glitchTriggerCharacteristic = await service.getCharacteristic(bleUUID.characteristic.glitchTrigger);
    console.log('Glitch Trigger characteristic found');
  } catch (error) {
    console.warn('Glitch Trigger characteristic not available on this device');
    glitchTriggerCharacteristic = null;
  }

  try {
    motionEnableFlagsCharacteristic = await service.getCharacteristic(bleUUID.characteristic.motionEnableFlags);
    console.log('Motion Enable Flags characteristic found');
  } catch (error) {
    console.warn('Motion Enable Flags characteristic not available on this device');
    motionEnableFlagsCharacteristic = null;
  }

  try {
    tapSensitivityCharacteristic = await service.getCharacteristic(bleUUID.characteristic.tapSensitivity);
    console.log('Tap Sensitivity characteristic found');
  } catch (error) {
    console.warn('Tap Sensitivity characteristic not available on this device');
    tapSensitivityCharacteristic = null;
  }

  try {
    glitchIntensityCharacteristic = await service.getCharacteristic(bleUUID.characteristic.glitchIntensity);
    console.log('Glitch Intensity characteristic found');
  } catch (error) {
    console.warn('Glitch Intensity characteristic not available on this device');
    glitchIntensityCharacteristic = null;
  }

  console.log('Reading value...');
  if (!isReconnect) {
    updateBLEProgress(90, 'Reading...');
  }

  let eyeStateValue = await eyeStateCharacteristic.readValue();
  let displayBrightnessValue = await displayBrightnessCharacteristic.readValue();
  let visemeValue = await visemeCharacteristic.readValue();
  let mouthStateValue = await mouthStateCharacteristic.readValue();
  let hornLedBrightnessValue = await hornLedBrightnessCharacteristic.readValue();
  let cheekPanelBrightnessValue = await cheekPanelBrightnessCharacteristic.readValue();
  let cheekBgColorValue = await cheekBgColorCharacteristic.readValue();
  let cheekFadeColorValue = await cheekFadeColorCharacteristic.readValue();

  // Read new Hub75 characteristics only if they exist
  let displayColorModeValue = null;
  let displayEffectColor1Value = null;
  let displayEffectColor2Value = null;
  let displayEffectOption1Value = null;
  let displayEffectOption2Value = null;
  let displayEffectOption3Value = null;

  if (displayColorModeCharacteristic) {
    displayColorModeValue = await displayColorModeCharacteristic.readValue();
  }
  if (displayEffectColor1Characteristic) {
    displayEffectColor1Value = await displayEffectColor1Characteristic.readValue();
  }
  if (displayEffectColor2Characteristic) {
    displayEffectColor2Value = await displayEffectColor2Characteristic.readValue();
  }
  if (displayEffectOption1Characteristic) {
    displayEffectOption1Value = await displayEffectOption1Characteristic.readValue();
  }
  if (displayEffectOption2Characteristic) {
    displayEffectOption2Value = await displayEffectOption2Characteristic.readValue();
  }
  if (displayEffectOption3Characteristic) {
    displayEffectOption3Value = await displayEffectOption3Characteristic.readValue();
  }

  // Read new Motion Detection & Glitch Control characteristics only if they exist
  let motionEnableFlagsValue = null;
  let tapSensitivityValue = null;
  let glitchIntensityValue = null;

  if (motionEnableFlagsCharacteristic) {
    motionEnableFlagsValue = await motionEnableFlagsCharacteristic.readValue();
  }
  if (tapSensitivityCharacteristic) {
    tapSensitivityValue = await tapSensitivityCharacteristic.readValue();
  }
  if (glitchIntensityCharacteristic) {
    glitchIntensityValue = await glitchIntensityCharacteristic.readValue();
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
  setViseme(visemeValue.getUint8(0));
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

  updateBLECharacteristicsDisplay(eyeStateValue.getUint8(0), displayBrightnessValue.getUint8(0), visemeValue.getUint8(0), mouthStateValue.getUint8(0), hornLedBrightnessValue.getUint8(0), cheekPanelBrightnessValue.getUint8(0), cheekBgColorValue, cheekFadeColorValue);
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

    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { name: bleUUID.name },
        { services: [bleUUID.service] },
      ],
    });

    bleDevice = device; // Store the device reference
    console.log(device.name);

    device.addEventListener('gattserverdisconnected', onDisconnected);

    // Use the shared connection function
    await connectToDevice(device, false);

  } catch (error) {
    console.error('Error:', error);
    alert(error);
  }
}


function onDisconnected(event) {
  const device = event.target;
  console.log(`Device ${device.name} is disconnected.`);

  // Clear BLE write queue on disconnect
  bleWriteQueue = [];
  isProcessingBleWrite = false;

  isStatusConnected(false);
  updateBLECharacteristicsDisplay('-', '-', '-', '-', '-', '-', null, null);
  showDisconnectPopup();
}

async function setEyeStateCharacteristic(value) {
  if (!eyeStateCharacteristic) {
    console.log('Not connected - eye state change skipped');
    return;
  }
  eyeStateCharacteristic.writeValue(Uint8Array.of(value))
    .then(_ => {
      console.log('> Characteristic eye state changed to: ' + Uint8Array.of(value));
      updateBLECharValue('ble-eyestate', value);
    })
    .catch(error => {
      console.error('Argh! ' + error);
    });
}

function setVisemeCharacteristic(value) {
  if (!visemeCharacteristic) {
    console.log('Not connected - viseme change skipped');
    return;
  }
  visemeCharacteristic.writeValue(Uint8Array.of(value))
    .then(_ => {
      console.log('> Characteristic viseme changed to: ' + Uint8Array.of(value));
      updateBLECharValue('ble-viseme', value);
    })
    .catch(error => {
      console.error('Argh! ' + error);
    });
}

function setMouthStateCharacteristic(value) {
  if (!mouthStateCharacteristic) {
    console.log('Not connected - mouth state change skipped');
    return;
  }
  mouthStateCharacteristic.writeValue(Uint8Array.of(value))
    .then(_ => {
      console.log('> Characteristic mouth state changed to: ' + Uint8Array.of(value));
      updateBLECharValue('ble-mouthstate', value);
    })
    .catch(error => {
      console.error('Argh! ' + error);
    });
}

let prevBrightnessValue = -1;
function setdisplayBrightnessCharacteristic(value) {
  if (!displayBrightnessCharacteristic) {
    console.log('Not connected - display brightness change skipped');
    return;
  }
  if (value !== prevBrightnessValue) {
    displayBrightnessCharacteristic.writeValue(Uint8Array.of(value))
      .then(_ => {
        console.log('> Characteristic viseme changed to: ' + Uint8Array.of(value));
        prevBrightnessValue = value; // Update the previous value
        updateBLECharValue('ble-brightness', value);
      })
      .catch(error => {
        console.error('Argh! ' + error);
      });
  }
}

let prevHornLedBrightnessValue = -1;
function setHornLedBrightnessCharacteristic(value) {
  if (!hornLedBrightnessCharacteristic) {
    console.log('Not connected - horn LED brightness change skipped');
    return;
  }
  if (value !== prevHornLedBrightnessValue) {
    hornLedBrightnessCharacteristic.writeValue(Uint8Array.of(value))
      .then(_ => {
        console.log('> Characteristic horn LED brightness changed to: ' + Uint8Array.of(value));
        prevHornLedBrightnessValue = value;
        updateBLECharValue('ble-hornled', value);
      })
      .catch(error => {
        console.error('Argh! ' + error);
      });
  }
}

let prevCheekPanelBrightnessValue = -1;
function setCheekPanelBrightnessCharacteristic(value) {
  if (!cheekPanelBrightnessCharacteristic) {
    console.log('Not connected - cheek panel brightness change skipped');
    return;
  }
  if (value !== prevCheekPanelBrightnessValue) {
    cheekPanelBrightnessCharacteristic.writeValue(Uint8Array.of(value))
      .then(_ => {
        console.log('> Characteristic cheek panel brightness changed to: ' + Uint8Array.of(value));
        prevCheekPanelBrightnessValue = value;
        updateBLECharValue('ble-cheekpanel', value);
      })
      .catch(error => {
        console.error('Argh! ' + error);
      });
  }
}

let prevCheekBgColor = null;
function setCheekBgColorCharacteristic(r, g, b) {
  if (!cheekBgColorCharacteristic) {
    console.log('Not connected - cheek BG color change skipped');
    return;
  }
  const colorKey = `${r},${g},${b}`;
  if (colorKey !== prevCheekBgColor) {
    prevCheekBgColor = colorKey;
    queueBleWrite(async () => {
      await cheekBgColorCharacteristic.writeValue(Uint8Array.of(r, g, b));
      console.log(`> Characteristic cheek BG color changed to: R=${r} G=${g} B=${b}`);
      updateBLECharColorValue('ble-cheekbgcolor', r, g, b);
    });
  }
}

let prevCheekFadeColor = null;
function setCheekFadeColorCharacteristic(r, g, b) {
  if (!cheekFadeColorCharacteristic) {
    console.log('Not connected - cheek fade color change skipped');
    return;
  }
  const colorKey = `${r},${g},${b}`;
  if (colorKey !== prevCheekFadeColor) {
    prevCheekFadeColor = colorKey;
    queueBleWrite(async () => {
      await cheekFadeColorCharacteristic.writeValue(Uint8Array.of(r, g, b));
      console.log(`> Characteristic cheek fade color changed to: R=${r} G=${g} B=${b}`);
      updateBLECharColorValue('ble-cheekfadecolor', r, g, b);
    });
  }
}

let prevDisplayColorMode = -1;
function setDisplayColorModeCharacteristic(mode) {
  if (!displayColorModeCharacteristic) {
    console.log('Not connected - display color mode change skipped');
    return;
  }
  if (mode !== prevDisplayColorMode) {
    prevDisplayColorMode = mode;
    queueBleWrite(async () => {
      await displayColorModeCharacteristic.writeValue(Uint8Array.of(mode));
      console.log(`> Characteristic display color mode changed to: ${mode}`);
      updateBLECharValue('ble-displaycolormode', mode);
    });
  }
}

let prevDisplayEffectColor1 = null;
function setDisplayEffectColor1Characteristic(r, g, b) {
  if (!displayEffectColor1Characteristic) {
    console.log('Not connected - display effect color 1 change skipped');
    return;
  }
  const colorKey = `${r},${g},${b}`;
  if (colorKey !== prevDisplayEffectColor1) {
    prevDisplayEffectColor1 = colorKey;
    queueBleWrite(async () => {
      await displayEffectColor1Characteristic.writeValue(Uint8Array.of(r, g, b));
      console.log(`> Characteristic display effect color 1 changed to: R=${r} G=${g} B=${b}`);
      updateBLECharColorValue('ble-displayeffectcolor1', r, g, b);
    });
  }
}

let prevDisplayEffectColor2 = null;
function setDisplayEffectColor2Characteristic(r, g, b) {
  if (!displayEffectColor2Characteristic) {
    console.log('Not connected - display effect color 2 change skipped');
    return;
  }
  const colorKey = `${r},${g},${b}`;
  if (colorKey !== prevDisplayEffectColor2) {
    prevDisplayEffectColor2 = colorKey;
    queueBleWrite(async () => {
      await displayEffectColor2Characteristic.writeValue(Uint8Array.of(r, g, b));
      console.log(`> Characteristic display effect color 2 changed to: R=${r} G=${g} B=${b}`);
      updateBLECharColorValue('ble-displayeffectcolor2', r, g, b);
    });
  }
}

let prevDisplayEffectOption1 = -1;
function setDisplayEffectOption1Characteristic(value) {
  if (!displayEffectOption1Characteristic) {
    console.log('Not connected - display effect option 1 change skipped');
    return;
  }
  if (value !== prevDisplayEffectOption1) {
    prevDisplayEffectOption1 = value;
    queueBleWrite(async () => {
      await displayEffectOption1Characteristic.writeValue(Uint8Array.of(value));
      console.log(`> Characteristic display effect option 1 changed to: ${value}`);
      updateBLECharValue('ble-displayeffectoption1', value);
    });
  }
}

let prevDisplayEffectOption2 = -1;
function setDisplayEffectOption2Characteristic(value) {
  if (!displayEffectOption2Characteristic) {
    console.log('Not connected - display effect option 2 change skipped');
    return;
  }
  if (value !== prevDisplayEffectOption2) {
    prevDisplayEffectOption2 = value;
    queueBleWrite(async () => {
      await displayEffectOption2Characteristic.writeValue(Uint8Array.of(value));
      console.log(`> Characteristic display effect option 2 changed to: ${value}`);
      updateBLECharValue('ble-displayeffectoption2', value);
    });
  }
}

let prevDisplayEffectOption3 = -1;
function setDisplayEffectOption3Characteristic(value) {
  if (!displayEffectOption3Characteristic) {
    console.log('Not connected - display effect option 3 change skipped');
    return;
  }
  if (value !== prevDisplayEffectOption3) {
    prevDisplayEffectOption3 = value;
    queueBleWrite(async () => {
      await displayEffectOption3Characteristic.writeValue(Uint8Array.of(value));
      console.log(`> Characteristic display effect option 3 changed to: ${value}`);
      updateBLECharValue('ble-displayeffectoption3', value);
    });
  }
}

// Motion Detection & Glitch Control Characteristics
function setGlitchTriggerCharacteristic(intensity) {
  if (!glitchTriggerCharacteristic) {
    console.log('Not connected - glitch trigger skipped');
    return;
  }
  queueBleWrite(async () => {
    await glitchTriggerCharacteristic.writeValue(Uint8Array.of(intensity));
    console.log(`> Glitch triggered with intensity: ${intensity}`);
  });
}

let prevMotionEnableFlags = -1;
function setMotionEnableFlagsCharacteristic(flags) {
  if (!motionEnableFlagsCharacteristic) {
    console.log('Not connected - motion enable flags change skipped');
    return;
  }
  if (flags !== prevMotionEnableFlags) {
    prevMotionEnableFlags = flags;
    queueBleWrite(async () => {
      await motionEnableFlagsCharacteristic.writeValue(Uint8Array.of(flags));
      console.log(`> Motion enable flags changed to: 0x${flags.toString(16)}`);
      updateBLECharValue('ble-motionenableflags', flags);
    });
  }
}

let prevTapSensitivity = -1;
function setTapSensitivityCharacteristic(value) {
  if (!tapSensitivityCharacteristic) {
    console.log('Not connected - tap sensitivity change skipped');
    return;
  }
  if (value !== prevTapSensitivity) {
    prevTapSensitivity = value;
    queueBleWrite(async () => {
      await tapSensitivityCharacteristic.writeValue(Uint8Array.of(value));
      console.log(`> Tap sensitivity changed to: ${value}`);
      updateBLECharValue('ble-tapsensitivity', value);
    });
  }
}

let prevGlitchIntensity = -1;
function setGlitchIntensityCharacteristic(value) {
  if (!glitchIntensityCharacteristic) {
    console.log('Not connected - glitch intensity change skipped');
    return;
  }
  if (value !== prevGlitchIntensity) {
    prevGlitchIntensity = value;
    queueBleWrite(async () => {
      await glitchIntensityCharacteristic.writeValue(Uint8Array.of(value));
      console.log(`> Glitch intensity changed to: ${value}`);
      updateBLECharValue('ble-glitchintensity', value);
    });
  }
}

const throttledAndDebouncedsetVisemeCharacteristic = throttleAndDebounce(setVisemeCharacteristic, 100, 50);
const throttledAndDebouncedSetDisplayBrightness = throttleAndDebounce(setdisplayBrightnessCharacteristic, 100, 50);
const throttledAndDebouncedSetHornLedBrightness = throttleAndDebounce(setHornLedBrightnessCharacteristic, 100, 50);
const throttledAndDebouncedSetCheekPanelBrightness = throttleAndDebounce(setCheekPanelBrightnessCharacteristic, 100, 50);
const throttledAndDebouncedSetCheekBgColor = throttleAndDebounce(setCheekBgColorCharacteristic, 150, 100);
const throttledAndDebouncedSetCheekFadeColor = throttleAndDebounce(setCheekFadeColorCharacteristic, 150, 100);
const throttledAndDebouncedSetDisplayEffectColor1 = throttleAndDebounce(setDisplayEffectColor1Characteristic, 150, 100);
const throttledAndDebouncedSetDisplayEffectColor2 = throttleAndDebounce(setDisplayEffectColor2Characteristic, 150, 100);
const throttledAndDebouncedSetDisplayEffectOption1 = throttleAndDebounce(setDisplayEffectOption1Characteristic, 100, 50);
const throttledAndDebouncedSetDisplayEffectOption2 = throttleAndDebounce(setDisplayEffectOption2Characteristic, 100, 50);
const throttledAndDebouncedSetDisplayEffectOption3 = throttleAndDebounce(setDisplayEffectOption3Characteristic, 100, 50);
const throttledAndDebouncedSetTapSensitivity = throttleAndDebounce(setTapSensitivityCharacteristic, 100, 50);
const throttledAndDebouncedSetGlitchIntensity = throttleAndDebounce(setGlitchIntensityCharacteristic, 100, 50);

// Throttle and debounce function
function throttleAndDebounce(func, throttleDelay, debounceDelay) {
  let isThrottled = false;
  let lastCallTime = 0;
  let timeoutId;

  function throttledAndDebounced(...args) {
    const currentTime = Date.now();

    // Throttle
    if (!isThrottled || currentTime - lastCallTime >= throttleDelay) {
      func.apply(this, args);
      lastCallTime = currentTime;
      isThrottled = true;
    }

    // Debounce
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      isThrottled = false;
      if (Date.now() - lastCallTime >= debounceDelay) {
        func.apply(this, args);
        lastCallTime = Date.now();
      }
    }, debounceDelay);
  }

  return throttledAndDebounced;
}

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

    const eyeStateValue = await eyeStateCharacteristic.readValue();
    const displayBrightnessValue = await displayBrightnessCharacteristic.readValue();
    const visemeValue = await visemeCharacteristic.readValue();
    const mouthStateValue = await mouthStateCharacteristic.readValue();
    const hornLedBrightnessValue = await hornLedBrightnessCharacteristic.readValue();
    const cheekPanelBrightnessValue = await cheekPanelBrightnessCharacteristic.readValue();
    const cheekBgColorValue = await cheekBgColorCharacteristic.readValue();
    const cheekFadeColorValue = await cheekFadeColorCharacteristic.readValue();

    // Read Hub75 characteristics only if available
    let displayColorModeValue = null;
    let displayEffectColor1Value = null;
    let displayEffectColor2Value = null;
    let displayEffectOption1Value = null;
    let displayEffectOption2Value = null;
    let displayEffectOption3Value = null;

    if (displayColorModeCharacteristic) {
      displayColorModeValue = await displayColorModeCharacteristic.readValue();
    }
    if (displayEffectColor1Characteristic) {
      displayEffectColor1Value = await displayEffectColor1Characteristic.readValue();
    }
    if (displayEffectColor2Characteristic) {
      displayEffectColor2Value = await displayEffectColor2Characteristic.readValue();
    }
    if (displayEffectOption1Characteristic) {
      displayEffectOption1Value = await displayEffectOption1Characteristic.readValue();
    }
    if (displayEffectOption2Characteristic) {
      displayEffectOption2Value = await displayEffectOption2Characteristic.readValue();
    }
    if (displayEffectOption3Characteristic) {
      displayEffectOption3Value = await displayEffectOption3Characteristic.readValue();
    }

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
    await rebootCharacteristic.writeValue(Uint8Array.of(1));
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