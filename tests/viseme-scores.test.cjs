const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Client, encodeSettings } = require('../src/core/viseme.js');

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
  await client.connect();
  assert.equal(client.supported, true);
  assert.equal(mix, null);
});

test('live scales merge drags, verify readback, reset and discard disconnected edits', async () => {
  const Manager = require('../src/managers/ble-manager.js');
  const manager = new Manager();
  manager.updateBusy = () => {};
  const defaults = [35, 13, 15, 11, 10];
  let device = defaults, fail = false, hold;
  const writes = [];
  const status = new DataView(new ArrayBuffer(16));
  status.setUint8(0, 3);
  const characteristics = {
    visemeSettings: { readValue: () => new DataView(encodeSettings({ threshold: 13, gain: 1, response: 1 })) },
    visemeCalibration: {},
    visemeStatus: { readValue: () => status, startNotifications() {}, addEventListener() {}, removeEventListener() {} },
    visemeScales: {
      readValue: () => new DataView(Uint8Array.from(device).buffer),
      async writeValue(bytes) {
        writes.push([...bytes]);
        if (hold) await hold();
        if (fail) throw new Error('link error');
        device = bytes.length === 1 ? defaults : [...bytes];
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
  const first = client.submitScales([20, 13, 15, 11, 10]);
  await writing;
  const second = client.submitScales([22, 13, 15, 11, 10]);
  const last = client.submitScales([22, 40, 15, 11, 10]);
  assert.deepEqual(client.scales, [22, 40, 15, 11, 10]);
  hold = null; release();
  await Promise.all([first, second, last]);
  assert.deepEqual(writes, [[20, 13, 15, 11, 10], [22, 40, 15, 11, 10]]);
  const pending = client.submitScales([50, 50, 50, 50, 50]);
  client.disconnect();
  await pending;
  await client.connect();
  assert.deepEqual(client.scales, [22, 40, 15, 11, 10]);
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
