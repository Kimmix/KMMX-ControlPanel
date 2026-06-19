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
let fanSpeedCharacteristic;
let fanEnabledCharacteristic;
let fanRPMCharacteristic;
let fanConnectedCharacteristic;
let visemeEnvelopeAttackCharacteristic;
let visemeEnvelopeReleaseCharacteristic;
let visemeAttackThresholdCharacteristic;
let visemeMinSeparationCharacteristic;
let visemeNoiseFloorMinCharacteristic;
let visemeNoiseFloorMaxCharacteristic;
let visemeNoiseAdaptSpeedCharacteristic;
let visemeAHScaleCharacteristic;
let visemeEEScaleCharacteristic;
let visemeOHScaleCharacteristic;
let visemeOOScaleCharacteristic;
let visemeTHScaleCharacteristic;
let bleDevice; // Store the connected device
let isConnecting = false; // Prevent multiple simultaneous connection attempts

const characteristicDefinitions = [
  ['eyeState', 'eyeState', value => eyeStateCharacteristic = value, true, { displayId: 'ble-eyestate' }],
  ['displayBrightness', 'display', value => displayBrightnessCharacteristic = value, true, { displayId: 'ble-brightness' }],
  ['viseme', 'viseme', value => visemeCharacteristic = value, true, { displayId: 'ble-viseme' }, handleVisemeChange],
  ['mouthState', 'mouthState', value => mouthStateCharacteristic = value, true, { displayId: 'ble-mouthstate' }],
  ['hornLedBrightness', 'hornLedBrightness', value => hornLedBrightnessCharacteristic = value, true, { displayId: 'ble-hornled' }],
  ['cheekPanelBrightness', 'cheekPanelBrightness', value => cheekPanelBrightnessCharacteristic = value, true, { displayId: 'ble-cheekpanel' }],
  ['cheekBgColor', 'cheekBgColor', value => cheekBgColorCharacteristic = value, true, { displayId: 'ble-cheekbgcolor', isColor: true, throttleMs: 150 }],
  ['cheekFadeColor', 'cheekFadeColor', value => cheekFadeColorCharacteristic = value, true, { displayId: 'ble-cheekfadecolor', isColor: true, throttleMs: 150 }],
  ['reboot', 'reboot', value => rebootCharacteristic = value, true],
  ['displayColorMode', 'displayColorMode', value => displayColorModeCharacteristic = value, false, { displayId: 'ble-displaycolormode' }],
  ['displayEffectColor1', 'displayEffectColor1', value => displayEffectColor1Characteristic = value, false, { displayId: 'ble-displayeffectcolor1', isColor: true, throttleMs: 150 }],
  ['displayEffectColor2', 'displayEffectColor2', value => displayEffectColor2Characteristic = value, false, { displayId: 'ble-displayeffectcolor2', isColor: true, throttleMs: 150 }],
  ['displayEffectOption1', 'displayEffectOption1', value => displayEffectOption1Characteristic = value, false, { displayId: 'ble-displayeffectoption1' }],
  ['displayEffectOption2', 'displayEffectOption2', value => displayEffectOption2Characteristic = value, false, { displayId: 'ble-displayeffectoption2' }],
  ['displayEffectOption3', 'displayEffectOption3', value => displayEffectOption3Characteristic = value, false, { displayId: 'ble-displayeffectoption3' }],
  ['glitchTrigger', 'glitchTrigger', value => glitchTriggerCharacteristic = value, false, { isTrigger: true }],
  ['motionEnableFlags', 'motionEnableFlags', value => motionEnableFlagsCharacteristic = value, false, { displayId: 'ble-motionenableflags' }],
  ['tapSensitivity', 'tapSensitivity', value => tapSensitivityCharacteristic = value, false, { displayId: 'ble-tapsensitivity' }],
  ['glitchIntensity', 'glitchIntensity', value => glitchIntensityCharacteristic = value, false, { displayId: 'ble-glitchintensity' }],
  ['fanSpeed', 'fanSpeed', value => fanSpeedCharacteristic = value, false, { displayId: 'ble-fanspeed' }],
  ['fanEnabled', 'fanEnabled', value => fanEnabledCharacteristic = value, false, { displayId: 'ble-fanenabled' }],
  ['fanRPM', 'fanRPM', value => fanRPMCharacteristic = value, false, { displayId: 'ble-fanrpm' }, handleFanRPMChange],
  ['fanConnected', 'fanConnected', value => fanConnectedCharacteristic = value, false, { displayId: 'ble-fanconnected' }, handleFanConnectedChange],
  ['visemeEnvelopeAttack', 'visemeEnvelopeAttack', value => visemeEnvelopeAttackCharacteristic = value],
  ['visemeEnvelopeRelease', 'visemeEnvelopeRelease', value => visemeEnvelopeReleaseCharacteristic = value],
  ['visemeAttackThreshold', 'visemeAttackThreshold', value => visemeAttackThresholdCharacteristic = value],
  ['visemeMinSeparation', 'visemeMinSeparation', value => visemeMinSeparationCharacteristic = value],
  ['visemeNoiseFloorMin', 'visemeNoiseFloorMin', value => visemeNoiseFloorMinCharacteristic = value],
  ['visemeNoiseFloorMax', 'visemeNoiseFloorMax', value => visemeNoiseFloorMaxCharacteristic = value],
  ['visemeNoiseAdaptSpeed', 'visemeNoiseAdaptSpeed', value => visemeNoiseAdaptSpeedCharacteristic = value],
  ['visemeAHScale', 'visemeAHScale', value => visemeAHScaleCharacteristic = value],
  ['visemeEEScale', 'visemeEEScale', value => visemeEEScaleCharacteristic = value],
  ['visemeOHScale', 'visemeOHScale', value => visemeOHScaleCharacteristic = value],
  ['visemeOOScale', 'visemeOOScale', value => visemeOOScaleCharacteristic = value],
  ['visemeTHScale', 'visemeTHScale', value => visemeTHScaleCharacteristic = value]
];

async function discoverCharacteristics(service) {
  for (const [name, uuidKey, setCharacteristic, required, options, notificationHandler] of characteristicDefinitions) {
    let characteristic;
    try {
      characteristic = await service.getCharacteristic(bleUUID.characteristic[uuidKey]);
    } catch (error) {
      setCharacteristic(null);
      if (required) throw error;
      console.warn(`${name} characteristic not available:`, error);
      continue;
    }

    setCharacteristic(characteristic);
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

    // Read Fan Control characteristics only if they exist (V4 only)
    let fanSpeedValue = null;
    let fanEnabledValue = null;
    let fanRPMValue = null;
    let fanConnectedValue = null;

    if (fanSpeedCharacteristic) {
      fanSpeedValue = await fanSpeedCharacteristic.readValue();
    }
    if (fanEnabledCharacteristic) {
      fanEnabledValue = await fanEnabledCharacteristic.readValue();
    }
    if (fanRPMCharacteristic) {
      fanRPMValue = await fanRPMCharacteristic.readValue();
    }
    if (fanConnectedCharacteristic) {
      fanConnectedValue = await fanConnectedCharacteristic.readValue();
    }

    // Read Viseme Advanced Parameters characteristics only if they exist
    if (visemeEnvelopeAttackCharacteristic) {
      try {
        const value = await visemeEnvelopeAttackCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme Envelope Attack: ${floatValue}`);
        // Update UI
        const slider = document.getElementById('visemeEnvelopeAttackSlider');
        const display = document.getElementById('visemeEnvelopeAttackValue');
        if (slider) slider.value = floatValue;
        if (display) display.textContent = floatValue.toFixed(2);
      } catch (err) {
        console.warn('Could not read visemeEnvelopeAttack:', err);
      }
    }

    if (visemeEnvelopeReleaseCharacteristic) {
      try {
        const value = await visemeEnvelopeReleaseCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme Envelope Release: ${floatValue}`);
        const slider = document.getElementById('visemeEnvelopeReleaseSlider');
        const display = document.getElementById('visemeEnvelopeReleaseValue');
        if (slider) slider.value = floatValue;
        if (display) display.textContent = floatValue.toFixed(2);
      } catch (err) {
        console.warn('Could not read visemeEnvelopeRelease:', err);
      }
    }

    if (visemeAttackThresholdCharacteristic) {
      try {
        const value = await visemeAttackThresholdCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme Attack Threshold: ${floatValue}`);
        const slider = document.getElementById('visemeAttackThresholdSlider');
        const display = document.getElementById('visemeAttackThresholdValue');
        if (slider) slider.value = floatValue;
        if (display) display.textContent = floatValue.toFixed(1);
      } catch (err) {
        console.warn('Could not read visemeAttackThreshold:', err);
      }
    }

    if (visemeMinSeparationCharacteristic) {
      try {
        const value = await visemeMinSeparationCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme Min Separation: ${floatValue}`);
        const slider = document.getElementById('visemeMinSeparationSlider');
        const display = document.getElementById('visemeMinSeparationValue');
        if (slider) slider.value = floatValue;
        if (display) display.textContent = floatValue.toFixed(1);
      } catch (err) {
        console.warn('Could not read visemeMinSeparation:', err);
      }
    }

    if (visemeNoiseFloorMinCharacteristic) {
      try {
        const value = await visemeNoiseFloorMinCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme Noise Floor Min: ${floatValue}`);
        const slider = document.getElementById('visemeNoiseFloorMinSlider');
        const display = document.getElementById('visemeNoiseFloorMinValue');
        if (slider) window.setVisemeNoiseFloorSlider?.('NoiseFloorMin', floatValue);
        if (display) display.textContent = floatValue.toFixed(0);
      } catch (err) {
        console.warn('Could not read visemeNoiseFloorMin:', err);
      }
    }

    if (visemeNoiseFloorMaxCharacteristic) {
      try {
        const value = await visemeNoiseFloorMaxCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme Noise Floor Max: ${floatValue}`);
        const slider = document.getElementById('visemeNoiseFloorMaxSlider');
        const display = document.getElementById('visemeNoiseFloorMaxValue');
        if (slider) window.setVisemeNoiseFloorSlider?.('NoiseFloorMax', floatValue);
        if (display) display.textContent = floatValue.toFixed(0);
      } catch (err) {
        console.warn('Could not read visemeNoiseFloorMax:', err);
      }
    }

    if (visemeNoiseAdaptSpeedCharacteristic) {
      try {
        const value = await visemeNoiseAdaptSpeedCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme Noise Adapt Speed: ${floatValue}`);
        const slider = document.getElementById('visemeNoiseAdaptSpeedSlider');
        const display = document.getElementById('visemeNoiseAdaptSpeedValue');
        if (slider) slider.value = floatValue;
        if (display) display.textContent = floatValue.toFixed(4);
      } catch (err) {
        console.warn('Could not read visemeNoiseAdaptSpeed:', err);
      }
    }

    if (visemeAHScaleCharacteristic) {
      try {
        const value = await visemeAHScaleCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme AH Scale: ${floatValue}`);
        const slider = document.getElementById('visemeAHScaleSlider');
        const display = document.getElementById('visemeAHScaleValue');
        if (slider) slider.value = floatValue;
        if (display) display.textContent = floatValue.toFixed(1);
      } catch (err) {
        console.warn('Could not read visemeAHScale:', err);
      }
    }

    if (visemeEEScaleCharacteristic) {
      try {
        const value = await visemeEEScaleCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme EE Scale: ${floatValue}`);
        const slider = document.getElementById('visemeEEScaleSlider');
        const display = document.getElementById('visemeEEScaleValue');
        if (slider) slider.value = floatValue;
        if (display) display.textContent = floatValue.toFixed(1);
      } catch (err) {
        console.warn('Could not read visemeEEScale:', err);
      }
    }

    if (visemeOHScaleCharacteristic) {
      try {
        const value = await visemeOHScaleCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme OH Scale: ${floatValue}`);
        const slider = document.getElementById('visemeOHScaleSlider');
        const display = document.getElementById('visemeOHScaleValue');
        if (slider) slider.value = floatValue;
        if (display) display.textContent = floatValue.toFixed(1);
      } catch (err) {
        console.warn('Could not read visemeOHScale:', err);
      }
    }

    if (visemeOOScaleCharacteristic) {
      try {
        const value = await visemeOOScaleCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme OO Scale: ${floatValue}`);
        const slider = document.getElementById('visemeOOScaleSlider');
        const display = document.getElementById('visemeOOScaleValue');
        if (slider) slider.value = floatValue;
        if (display) display.textContent = floatValue.toFixed(1);
      } catch (err) {
        console.warn('Could not read visemeOOScale:', err);
      }
    }

    if (visemeTHScaleCharacteristic) {
      try {
        const value = await visemeTHScaleCharacteristic.readValue();
        const floatValue = value.getFloat32(0, true);
        console.log(`✓ Viseme TH Scale: ${floatValue}`);
        const slider = document.getElementById('visemeTHScaleSlider');
        const display = document.getElementById('visemeTHScaleValue');
        if (slider) slider.value = floatValue;
        if (display) display.textContent = floatValue.toFixed(1);
      } catch (err) {
        console.warn('Could not read visemeTHScale:', err);
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
    if (fanEnabledValue) {
      console.log(`Fan Enabled: ${fanEnabledValue.getUint8(0) ? 'Yes' : 'No'}`);
    }
    if (fanRPMValue) {
      console.log(`Fan RPM: ${fanRPMValue.getUint16(0, true)}`); // true for little-endian
    }
    if (fanConnectedValue) {
      console.log(`Fan Connected: ${fanConnectedValue.getUint8(0) ? 'Yes' : 'No'}`);
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

    // Set Fan Control values only if available (V4 only)
    if (fanSpeedValue) {
      setFanSpeedValue(fanSpeedValue.getUint8(0));
    }
    if (fanEnabledValue) {
      setFanEnabledValue(fanEnabledValue.getUint8(0));
    }
    if (fanRPMValue) {
      setFanRPMValue(fanRPMValue.getUint16(0, true)); // little-endian
    }
    if (fanConnectedValue) {
      setFanConnectedValue(fanConnectedValue.getUint8(0));
    }

    // Show/hide fan control section based on availability
    if (typeof updateFanControlVisibility === 'function') {
      updateFanControlVisibility(fanSpeedCharacteristic !== null);
    }

    updateBLECharacteristicsDisplay(eyeStateValue.getUint8(0), displayBrightnessValue.getUint8(0), visemeValue.getUint8(0), mouthStateValue.getUint8(0), hornLedBrightnessValue.getUint8(0), cheekPanelBrightnessValue.getUint8(0), cheekBgColorValue, cheekFadeColorValue);

    // Connection successful - clear the flag
    isConnecting = false;

  } catch (error) {
    console.error('Error during BLE connection:', error);

    // Check if it's a disconnection error and we should retry
    const isDisconnectionError = error.message && (
      error.message.includes('GATT Server is disconnected') ||
      error.message.includes('Device disconnected')
    );

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
  const device = devices.find(({ name }) => name?.startsWith('KimmixController'))
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

async function setEyeStateCharacteristic(value) {
  bleManager.write('eyeState', value);
}

function setVisemeCharacteristic(value) {
  bleManager.write('viseme', value);
}

function handleVisemeChange(event) {
  const value = event.target.value.getUint8(0);
  setViseme(value);
  updateBLECharValue('ble-viseme', value);
}

function setMouthStateCharacteristic(value) {
  bleManager.write('mouthState', value);
}

function setdisplayBrightnessCharacteristic(value) {
  bleManager.write('displayBrightness', value);
}

function setHornLedBrightnessCharacteristic(value) {
  bleManager.write('hornLedBrightness', value);
}

function setCheekPanelBrightnessCharacteristic(value) {
  bleManager.write('cheekPanelBrightness', value);
}

function setCheekBgColorCharacteristic(r, g, b) {
  bleManager.write('cheekBgColor', [r, g, b]);
}

function setCheekFadeColorCharacteristic(r, g, b) {
  bleManager.write('cheekFadeColor', [r, g, b]);
}

function setDisplayColorModeCharacteristic(mode) {
  bleManager.write('displayColorMode', mode);
}

function setDisplayEffectColor1Characteristic(r, g, b) {
  bleManager.write('displayEffectColor1', [r, g, b]);
}

function setDisplayEffectColor2Characteristic(r, g, b) {
  bleManager.write('displayEffectColor2', [r, g, b]);
}

function setDisplayEffectOption1Characteristic(value) {
  bleManager.write('displayEffectOption1', value);
}

function setDisplayEffectOption2Characteristic(value) {
  bleManager.write('displayEffectOption2', value);
}

function setDisplayEffectOption3Characteristic(value) {
  bleManager.write('displayEffectOption3', value);
}

// Motion Detection & Glitch Control Characteristics
function setGlitchTriggerCharacteristic(intensity) {
  bleManager.write('glitchTrigger', intensity);
}

function setMotionEnableFlagsCharacteristic(flags) {
  bleManager.write('motionEnableFlags', flags);
}

function setTapSensitivityCharacteristic(value) {
  bleManager.write('tapSensitivity', value);
}

function setGlitchIntensityCharacteristic(value) {
  bleManager.write('glitchIntensity', value);
}

// Fan Control Characteristics (V4 Only)
function setFanSpeedCharacteristic(speed) {
  bleManager.write('fanSpeed', speed);
}

function setFanEnabledCharacteristic(enabled) {
  bleManager.write('fanEnabled', enabled);
}

// Viseme Advanced Parameters Characteristics
function writeVisemeFloat(name, value) {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setFloat32(0, value, true);
  bleManager.writeBuffer(name, buffer, value);
}

const setVisemeEnvelopeAttackCharacteristic = value => writeVisemeFloat('visemeEnvelopeAttack', value);
const setVisemeEnvelopeReleaseCharacteristic = value => writeVisemeFloat('visemeEnvelopeRelease', value);
const setVisemeAttackThresholdCharacteristic = value => writeVisemeFloat('visemeAttackThreshold', value);
const setVisemeMinSeparationCharacteristic = value => writeVisemeFloat('visemeMinSeparation', value);
const setVisemeNoiseFloorMinCharacteristic = value => writeVisemeFloat('visemeNoiseFloorMin', value);
const setVisemeNoiseFloorMaxCharacteristic = value => writeVisemeFloat('visemeNoiseFloorMax', value);
const setVisemeNoiseAdaptSpeedCharacteristic = value => writeVisemeFloat('visemeNoiseAdaptSpeed', value);
const setVisemeAHScaleCharacteristic = value => writeVisemeFloat('visemeAHScale', value);
const setVisemeEEScaleCharacteristic = value => writeVisemeFloat('visemeEEScale', value);
const setVisemeOHScaleCharacteristic = value => writeVisemeFloat('visemeOHScale', value);
const setVisemeOOScaleCharacteristic = value => writeVisemeFloat('visemeOOScale', value);
const setVisemeTHScaleCharacteristic = value => writeVisemeFloat('visemeTHScale', value);

// Notification handlers for Fan Control
function handleFanRPMChange(event) {
  const value = event.target.value;
  const rpm = value.getUint16(0, true); // little-endian
  console.log(`Fan RPM updated: ${rpm}`);

  // Update UI
  if (typeof updateFanRPMDisplay === 'function') {
    updateFanRPMDisplay(rpm);
  }
}

function handleFanConnectedChange(event) {
  const value = event.target.value;
  const connected = value.getUint8(0);
  console.log(`Fan connection status updated: ${connected ? 'Connected' : 'Disconnected'}`);

  // Update UI
  if (typeof updateFanConnectionDisplay === 'function') {
    updateFanConnectionDisplay(connected);
  }
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

const throttledVisemeFloatWriters = Object.fromEntries([
  ['EnvelopeAttack', setVisemeEnvelopeAttackCharacteristic],
  ['EnvelopeRelease', setVisemeEnvelopeReleaseCharacteristic],
  ['AttackThreshold', setVisemeAttackThresholdCharacteristic],
  ['MinSeparation', setVisemeMinSeparationCharacteristic],
  ['NoiseFloorMin', setVisemeNoiseFloorMinCharacteristic],
  ['NoiseFloorMax', setVisemeNoiseFloorMaxCharacteristic],
  ['NoiseAdaptSpeed', setVisemeNoiseAdaptSpeedCharacteristic],
  ['AHScale', setVisemeAHScaleCharacteristic],
  ['EEScale', setVisemeEEScaleCharacteristic],
  ['OHScale', setVisemeOHScaleCharacteristic],
  ['OOScale', setVisemeOOScaleCharacteristic],
  ['THScale', setVisemeTHScaleCharacteristic]
].map(([name, write]) => [name, bleManager.throttleAndDebounce(write, 100, 50)]));
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
