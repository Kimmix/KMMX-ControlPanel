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
