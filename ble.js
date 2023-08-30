const bleUUID = {
  name: "KMMX-BLE",
  service: "c1449275-bf34-40ab-979d-e34a1fdbb129",
  characteristic : {
    display: "9fdfd124-966b-44f7-8331-778c4d1512fc",
    eyeState: "49a36bb2-1c66-4e5c-8ff3-28e55a64beb3",
    viseme: "493d06f3-0fa0-4a90-88f1-ebaed0da9b80"
  }
};

let eyeStateCharacteristic;
let displayBrightnessCharacteristic;
let visemeCharacteristic;

async function startBLE() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { name: bleUUID.name },
        { services: [bleUUID.service] },
      ],
    });

    console.log(device.name);
    device.addEventListener('gattserverdisconnected', onDisconnected);
    const server = await device.gatt.connect();

    console.log('Connected to GATT Server');
    const service = await server.getPrimaryService(bleUUID.service);

    console.log('Getting service...');
    eyeStateCharacteristic = await service.getCharacteristic(bleUUID.characteristic.eyeState);
    displayBrightnessCharacteristic = await service.getCharacteristic(bleUUID.characteristic.display);
    visemeCharacteristic = await service.getCharacteristic(bleUUID.characteristic.viseme);

    console.log('Reading value...');
    let eyeStateValue = await eyeStateCharacteristic.readValue();
    let displayBrightnessValue = await displayBrightnessCharacteristic.readValue();
    let visemeValue = await visemeCharacteristic.readValue();

    console.log(`Eye state is ${eyeStateValue.getUint8(0)}`);
    console.log(`Display brightness is ${displayBrightnessValue.getUint8(0)}`);
    console.log(`Viseme value is ${visemeValue.getUint8(0)}`);

    isStatusConnected(true);
    setBrightnessvalue(displayBrightnessValue.getUint8(0));
    setExpression(eyeStateValue.getUint8(0));
    setViseme(visemeValue.getUint8(0));

  } catch (error) {
    console.error('Error:', error);
    alert(error);
  }
}


function onDisconnected(event) {
  const device = event.target;
  console.log(`Device ${device.name} is disconnected.`);
  isStatusConnected(false);
}

async function setEyeStateCharacteristic(value) {
  eyeStateCharacteristic.writeValue(Uint8Array.of(value))
    .then(_ => {
      console.log('> Characteristic eye state changed to: ' + Uint8Array.of(value));
    })
    .catch(error => {
      console.log('Argh! ' + error);
    });
}

function setVisemeCharacteristic(value) {
  visemeCharacteristic.writeValue(Uint8Array.of(value))
    .then(_ => {
      console.log('> Characteristic viseme changed to: ' + Uint8Array.of(value));
    })
    .catch(error => {
      console.log('Argh! ' + error);
    });
}

let prevBrightnessValue = -1;
function setdisplayBrightnessCharacteristic(value) {
  if (value !== prevBrightnessValue) {
    displayBrightnessCharacteristic.writeValue(Uint8Array.of(value))
      .then(_ => {
        console.log('> Characteristic viseme changed to: ' + Uint8Array.of(value));
        prevBrightnessValue = value; // Update the previous value
      })
      .catch(error => {
        console.log('Argh! ' + error);
      });
  }
}

const throttledAndDebouncedsetVisemeCharacteristic = throttleAndDebounce(setVisemeCharacteristic, 800, 300);
const throttledAndDebouncedSetDisplayBrightness = throttleAndDebounce(setdisplayBrightnessCharacteristic, 300, 200);

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