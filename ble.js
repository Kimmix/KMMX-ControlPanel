const bleUUID = {
  service: "c1449275-bf34-40ab-979d-e34a1fdbb129",
  displayBrightnessCharacteristic: "9fdfd124-966b-44f7-8331-778c4d1512fc",
  eyeStateCharacteristic: "49a36bb2-1c66-4e5c-8ff3-28e55a64beb3",
  visemeCharacteristic: "493d06f3-0fa0-4a90-88f1-ebaed0da9b80"
};

let eyeStateCharacteristic;

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
    .then(service => service.getCharacteristic(bleUUID.eyeStateCharacteristic))
    .then(characteristic => {
      eyeStateCharacteristic = characteristic; // Store the characteristic for later use
      return characteristic.readValue();
    })
    .then(value => {
      console.log('Device connected');
      console.log(`Eye state is ${value.getUint8(0)}`);
      setExpression(value.getUint8(0));
      isStatusConnected(true);
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

function onExpressionButtonClick(buttonId) {
  setCurrentExpression(buttonId);
  if (!eyeStateCharacteristic) {
    return;
  }
  let value = setFace(buttonId);
  eyeStateCharacteristic.writeValue(Uint8Array.of(value))
    .then(_ => {
      console.log('> Characteristic User Description changed to: ' + Uint8Array.of(value));
    })
    .catch(error => {
      console.log('Argh! ' + error);
    });
}


function setFace(buttonId) {
  switch (buttonId) {
    case "button1":
      return 0
    case "button2":
      return 1
    case "button3":
      return 2
    default:
      return 0
  }
}