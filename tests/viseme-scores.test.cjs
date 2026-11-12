const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Client, encodeSettings, encodeScales, decodeScales, scaleFromSlider, scaleToSlider } = require('../src/core/viseme.js');

test('scale v2 golden packet preserves hundredths and rejects invalid or legacy frames', () => {
  const values = [163, 1, 500, 0, 100];
  const bytes = encodeScales(values);
  assert.deepEqual([...bytes], [2, 163, 0, 1, 0, 244, 1, 0, 0, 100, 0]);
  assert.deepEqual(decodeScales(new DataView(bytes.buffer)), values);
  assert.throws(() => decodeScales(new DataView(new ArrayBuffer(5))), /Update your controller/);
  assert.throws(() => decodeScales(new DataView(new ArrayBuffer(10))), /Invalid/);
  bytes[0] = 3;
  assert.throws(() => decodeScales(new DataView(bytes.buffer)), /Invalid/);
  bytes[0] = 2; bytes[9] = 245; bytes[10] = 1;
  assert.throws(() => decodeScales(new DataView(bytes.buffer)), /Invalid/);
  for (const invalid of [[501, 1, 1, 1, 1], [-1, 1, 1, 1, 1], [1.5, 1, 1, 1, 1], [1]]) {
    assert.throws(() => encodeScales(invalid), /Invalid/);
  }
});

test('mouth sensitivity curve preserves zero, every firmware step and the maximum', () => {
  assert.equal(scaleFromSlider(0), 0);
  assert.equal(scaleFromSlider(100), 500);
  assert.equal(scaleFromSlider(50), 125);
  for (let value = 0; value <= 500; value++) {
    assert.equal(scaleFromSlider(scaleToSlider(value)), value);
    if (value) assert.ok(scaleToSlider(value) > scaleToSlider(value - 1));
  }
});

test('mouth sliders submit curved pointer values and single-hundredth arrow steps', () => {
  const { readFileSync } = require('node:fs');
  const vm = require('node:vm');
  const source = readFileSync(require.resolve('../src/core/viseme-ui.js'), 'utf8');
  const inputs = Array.from({ length: 5 }, () => ({
    handlers: {}, valueAsNumber: 50,
    addEventListener(type, handler) { this.handlers[type] = handler; }
  }));
  const client = { scales: [0, 100, 200, 300, 500], submitScales(values) { this.scales = values; } };
  vm.runInNewContext(source.slice(source.indexOf('scaleInputs.forEach('), source.indexOf("resetScales.addEventListener")), {
    scaleInputs: inputs, visemeClient: client, VisemeV2: { scaleFromSlider }
  });
  inputs[0].handlers.input();
  assert.equal(client.scales[0], 125);
  let prevented = false;
  inputs[0].handlers.keydown({ key: 'ArrowRight', preventDefault() { prevented = true; } });
  assert.equal(client.scales[0], 126);
  assert.equal(prevented, true);
  for (const [index, key, expected] of [[0, 'ArrowDown', 125], [4, 'ArrowUp', 500]]) {
    inputs[index].handlers.keydown({ key, preventDefault() {} });
    assert.equal(client.scales[index], expected);
  }
  client.scales[0] = 0;
  inputs[0].handlers.keydown({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(client.scales[0], 0);
});

test('score read, notification, malformed frame and disconnect', async () => {
  const status = new DataView(new ArrayBuffer(16));
  status.setUint8(0, 3);
  const settings = new DataView(encodeSettings({ threshold: 13, gain: 1, response: 1 }));
  const packet = values => new DataView(Uint8Array.from(values).buffer);
  let listener, mix;
  const chars = {
    visemeSettings: { readValue: () => settings }, visemeCalibration: {},
    visemeStatus: { readValue: () => status, startNotifications() {}, addEventListener() {}, removeEventListener() {} },
    visemeScores: {
      readValue: () => packet([137, 0, 118, 0, 0]), startNotifications() {},
      addEventListener(_, fn) { listener = fn; },
      removeEventListener(_, fn) { assert.equal(fn, listener); listener = null; }
    }
  };
  const client = new Client({ get: key => chars[key], enqueue: fn => fn() }, undefined, value => { mix = value; });
  await client.connect();
  assert.equal(client.scales, null); // Older firmware still streams scores.
  assert.deepEqual(mix, [137, 0, 118, 0, 0]);
  listener({ target: { value: packet([0, 0, 0, 0, 255]) } });
  assert.deepEqual(mix, [0, 0, 0, 0, 255]);
  listener({ target: { value: packet([1]) } });
  assert.equal(mix, null);
  client.disconnect();
  assert.equal(listener, null);
  delete chars.visemeScores;
  chars.visemeScales = { readValue: () => packet([35, 13, 15, 11, 10]) };
  await client.connect();
  assert.equal(client.supported, true);
  assert.equal(mix, null);
  assert.equal(client.scales, null);
  assert.match(client.scaleError, /Update your controller/);
});

test('live scales merge drags, verify readback, reset and discard disconnected edits', async () => {
  const Manager = require('../src/managers/ble-manager.js');
  const manager = new Manager();
  manager.updateBusy = () => {};
  const defaults = [350, 130, 150, 110, 100];
  let device = defaults, fail = false, hold;
  const writes = [];
  const status = new DataView(new ArrayBuffer(16));
  status.setUint8(0, 3);
  const characteristics = {
    visemeSettings: { readValue: () => new DataView(encodeSettings({ threshold: 13, gain: 1, response: 1 })) },
    visemeCalibration: {},
    visemeStatus: { readValue: () => status, startNotifications() {}, addEventListener() {}, removeEventListener() {} },
    visemeScales: {
      readValue: () => new DataView(encodeScales(device).buffer),
      async writeValue(bytes) {
        writes.push([...bytes]);
        if (hold) await hold();
        if (fail) throw new Error('link error');
        device = bytes.length === 1 ? defaults : decodeScales(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength));
      }
    }
  };
  manager.get = name => characteristics[name];
  const client = new Client(manager);
  await client.connect();
  assert.deepEqual(client.scales, defaults);
  let started, release;
  const writing = new Promise(resolve => { started = resolve; });
  hold = () => { started(); return new Promise(resolve => { release = resolve; }); };
  const first = client.submitScales([200, 130, 150, 110, 100]);
  await writing;
  const second = client.submitScales([223, 130, 150, 110, 100]);
  const last = client.submitScales([223, 401, 150, 110, 100]);
  assert.deepEqual(client.scales, [223, 401, 150, 110, 100]);
  hold = null; release();
  await Promise.all([first, second, last]);
  assert.deepEqual(writes, [[...encodeScales([200, 130, 150, 110, 100])], [...encodeScales([223, 401, 150, 110, 100])]]);
  const pending = client.submitScales([500, 500, 500, 500, 500]);
  client.disconnect();
  await pending;
  await client.connect();
  assert.deepEqual(client.scales, [223, 401, 150, 110, 100]);
  assert.equal(writes.length, 2);
  fail = true;
  await client.submitScales(defaults);
  assert.match(client.scaleError, /link error/);
  assert.deepEqual(client.scales, device);
  fail = false;
  await client.submitScales(null);
  assert.deepEqual(writes.at(-1), [255]);
  assert.deepEqual(client.scales, defaults);
});
