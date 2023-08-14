const bleUUID = {
  service: "c1449275-bf34-40ab-979d-e34a1fdbb129",
  displayBrightnessCharacteristic: "9fdfd124-966b-44f7-8331-778c4d1512fc",
  eyeStateCharacteristic: "49a36bb2-1c66-4e5c-8ff3-28e55a64beb3",
  visemeCharacteristic: "493d06f3-0fa0-4a90-88f1-ebaed0da9b80"
};

let eyeStateCharacteristic;
let displayBrightnessCharacteristic;
let visemeCharacteristic;

function startBLE() {
  navigator.bluetooth.requestDevice({
    filters: [
      { name: "KMMX-BLE" },
      { services: [bleUUID.service] },
    ]
  })
    .then(device => {
      console.log(device.name);
      device.addEventListener('gattserverdisconnected', onDisconnected);
      return device.gatt.connect();
    })
    .then(server => {
      console.log('Connected to GATT Server');
      return server.getPrimaryService(bleUUID.service);
    })
    .then(service => {
      return Promise.all([
        service.getCharacteristic(bleUUID.eyeStateCharacteristic),
        service.getCharacteristic(bleUUID.displayBrightnessCharacteristic),
        service.getCharacteristic(bleUUID.visemeCharacteristic)
      ]);
    })
    .then(characteristics => {
      [eyeStateCharacteristic, displayBrightnessCharacteristic, visemeCharacteristic] = characteristics;
      return Promise.all([
        eyeStateCharacteristic.readValue(),
        displayBrightnessCharacteristic.readValue(),
        visemeCharacteristic.readValue()
      ]);
    })
    .then(values => {
      const eyeStateValue = values[0].getUint8(0);
      const displayBrightnessValue = values[1].getUint8(0);
      const visemeValue = values[2].getUint8(0);
      console.log('Device connected');
      console.log(`Eye state is ${eyeStateValue}`);
      console.log(`Display brightness is ${displayBrightnessValue}`);
      console.log(`Viseme value is ${visemeValue}`);

      isStatusConnected(true);

      setBrightnessvalue(displayBrightnessValue);
      setExpression(eyeStateValue);
      setViseme(visemeValue);

    })
    .catch(error => {
      console.error('Error:', error);
      alert(error);
    });
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

const throttledAndDebouncedSetDisplayBrightness = throttleAndDebounce(setdisplayBrightnessCharacteristic, 300, 200);

// Throttle and debounce function
function throttleAndDebounce(func, throttleDelay, debounceDelay) {
  let isThrottled = false;
  let isDebounced = false;
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
      isDebounced = false;
      if (Date.now() - lastCallTime >= debounceDelay) {
        func.apply(this, args);
        lastCallTime = Date.now();
        isDebounced = true;
      }
    }, debounceDelay);
  }

  return throttledAndDebounced;
}