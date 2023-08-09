let myDescriptor;
// const brightness = document.getElementById("brightness").value;
const statusElement = document.getElementById("status");

function startBLE() {
  navigator.bluetooth.requestDevice({
    // acceptAllDevices: true,
    // optionalServices: ['d0e21a4b-d38e-460f-90f7-8c8082284aee']
    filters: [
      { name: "KMMX-BLE" },
      { services: ['c1449275-bf34-40ab-979d-e34a1fdbb129'] },
    ]
  })
    .then(device => {
      // Human-readable name of the device.
      console.log(device.name);
      // Set up event listener for when device gets disconnected.
      device.addEventListener('gattserverdisconnected', onDisconnected);
      // Attempts to connect to remote GATT Server.
      return device.gatt.connect();
    })
    .then(server => server.getPrimaryService('c1449275-bf34-40ab-979d-e34a1fdbb129'))
    .then(service => service.getCharacteristic('9fdfd124-966b-44f7-8331-778c4d1512fc'))
    .then(characteristic => {
      myDescriptor = characteristic
      brightness = characteristic.properties.read
      console.log(brightness)
    })
    .then(_ => {
      console.log('Device connected');
      statusElement.textContent = "Connected";
    })
    .catch(error => { console.error(error); });
}

function onDisconnected(event) {
  const device = event.target;
  console.log(`Device ${device.name} is disconnected.`);
  statusElement.textContent = "Disconnected";
}

function onWriteButtonClick(value) {
  if (!myDescriptor) {
    return;
  }
  myDescriptor.writeValue(Uint8Array.of(value))
    .then(_ => {
      console.log('> Characteristic User Description changed to: ' + Uint8Array.of(value));
    })
    .catch(error => {
      console.log('Argh! ' + error);
    });
}

