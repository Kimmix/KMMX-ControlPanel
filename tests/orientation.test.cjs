const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Client, decode, render } = require('../src/core/orientation.js');

function packet(status = 2, pitch = -45, roll = 90, yaw = -180) {
  const v = new DataView(new ArrayBuffer(14));
  v.setUint8(0, 1); v.setUint8(1, status);
  [pitch, roll, yaw].forEach((value, i) => v.setFloat32(2 + 4 * i, value, true));
  return v;
}
function fixture() {
  const listeners = new Set();
  const characteristic = {
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
    async startNotifications() {},
    async readValue() { return packet(); },
  };
  const manager = { get: () => characteristic, enqueue: op => op() };
  const client = new Client(manager);
  const emit = view => { for (const fn of listeners) fn({ target: { value: view } }); };
  return { client, characteristic, manager, listeners, emit };
}
test('decodes exact little-endian signed packet', () => {
  const bytes = Uint8Array.from([1, 2, 0, 0, 0x34, 0xc2, 0, 0, 0xb4, 0x42, 0, 0, 0x34, 0xc3]);
  assert.deepEqual(decode(new DataView(bytes.buffer)), { status: 2, pitch: -45, roll: 90, yaw: -180 });
});
test('rejects wrong lengths, version, status and non-finite ready angles', () => {
  for (const size of [0, 13, 15]) assert.throws(() => decode(new DataView(new ArrayBuffer(size))));
  const badVersion = packet(); badVersion.setUint8(0, 2);
  assert.throws(() => decode(badVersion));
  assert.throws(() => decode(packet(3)));
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.throws(() => decode(packet(2, value)));
    assert.throws(() => decode(packet(2, 0, value)));
    assert.throws(() => decode(packet(2, 0, 0, value)));
  }
});
test('missing firmware, V2 and unavailable sensor have distinct states', async () => {
  const f = fixture(); f.manager.get = () => null;
  await f.client.connect(); assert.match(f.client.message, /Update your controller/);
  f.client.receive(packet(0)); assert.match(f.client.message, /does not support/); assert.equal(f.client.sample, null);
  f.client.receive(packet(1)); assert.match(f.client.message, /sensor is unavailable/); assert.equal(f.client.sample, null);
  f.client.disconnect();
});
test('subscribes before READ, updates, clears malformed readings and reconnects without duplicate listeners', async () => {
  const f = fixture();
  f.characteristic.readValue = async () => { assert.equal(f.listeners.size, 1); return packet(); };
  await f.client.connect(); assert.equal(f.client.sample.pitch, -45);
  f.emit(packet(2, 12)); assert.equal(f.client.sample.pitch, 12);
  f.emit(packet(2, NaN)); assert.equal(f.client.sample, null);
  f.emit(packet()); assert.equal(f.client.sample.pitch, -45);
  f.client.disconnect(); assert.equal(f.listeners.size, 0); assert.equal(f.client.sample, null);
  await f.client.connect(); assert.equal(f.listeners.size, 1);
  await f.client.connect(); assert.equal(f.listeners.size, 1);
  f.client.disconnect(); assert.equal(f.listeners.size, 0);
});
test('subscription/read failures leave no listeners or readings', async () => {
  for (const operation of ['startNotifications', 'readValue']) {
    const f = fixture(); f.characteristic[operation] = async () => { throw new Error('failed'); };
    await f.client.connect();
    assert.equal(f.client.sample, null); assert.equal(f.listeners.size, 0);
    assert.match(f.client.message, /readings are unavailable/);
    f.client.disconnect();
  }
});
test('disconnect during pending subscription/read cannot revive old readings', async () => {
  for (const operation of ['startNotifications', 'readValue']) {
    const f = fixture(); let release;
    f.characteristic[operation] = () => new Promise(resolve => { release = resolve; });
    const connecting = f.client.connect();
    await Promise.resolve();
    f.client.disconnect(); release(packet()); await connecting;
    assert.equal(f.client.sample, null); assert.equal(f.listeners.size, 0);
    assert.match(f.client.message, /Connect to view/);
  }
});
test('stale timeout clears readings after two seconds and a valid packet recovers', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = fixture(); await f.client.connect();
  t.mock.timers.tick(1999); assert.ok(f.client.sample);
  f.emit(packet(2, 5)); t.mock.timers.tick(1999); assert.ok(f.client.sample);
  t.mock.timers.tick(1); assert.equal(f.client.sample, null);
  assert.match(f.client.message, /readings are unavailable/);
  f.emit(packet()); assert.ok(f.client.sample);
  f.client.disconnect(); t.mock.timers.tick(2000); assert.match(f.client.message, /Connect to view/);
});
test('meters keep actual numbers, clamp fill and clear unavailable readings', () => {
  const elements = {};
  for (const axis of ['pitch', 'roll', 'yaw']) {
    elements[`orientation-${axis}-value`] = {};
    elements[`orientation-${axis}`] = { firstElementChild: { style: {} }, attrs: {},
      setAttribute(name, value) { this.attrs[name] = value; }, removeAttribute(name) { delete this.attrs[name]; } };
  }
  const document = { getElementById: id => elements[id] };
  render({ message: 'Head movement', sample: { pitch: -120, roll: 0, yaw: 200 } }, document);
  assert.equal(elements['orientation-pitch-value'].textContent, '-120.0°');
  assert.equal(elements['orientation-pitch'].firstElementChild.style.left, '0%');
  assert.equal(elements['orientation-pitch'].firstElementChild.style.width, '50%');
  assert.equal(elements['orientation-yaw'].firstElementChild.style.width, '50%');
  assert.equal(elements['orientation-roll'].firstElementChild.style.width, '0%');
  assert.equal(elements['orientation-yaw'].attrs['aria-valuetext'], '200.0 degrees');
  render({ message: 'Disconnected', sample: null }, document);
  assert.equal(elements['orientation-pitch-value'].textContent, '—');
  assert.equal(elements['orientation-pitch'].firstElementChild.style.width, '0%');
  assert.equal(elements['orientation-pitch'].attrs.role, 'group');
  assert.equal(elements['orientation-pitch'].attrs['aria-valuemin'], undefined);
});

test('browser bootstrap uses the existing lexical BLE manager and initializes cleared meters', () => {
  const { readFileSync } = require('node:fs');
  const { resolve } = require('node:path');
  const vm = require('node:vm');
  const elements = {};
  for (const axis of ['pitch', 'roll', 'yaw']) {
    elements[`orientation-${axis}-value`] = {};
    elements[`orientation-${axis}`] = { firstElementChild: { style: {} }, setAttribute() {}, removeAttribute() {} };
  }
  const context = vm.createContext({ document: { getElementById: id => elements[id] }, clearTimeout });
  vm.runInContext(readFileSync(resolve(__dirname, '../src/managers/ble-manager.js'), 'utf8'), context);
  vm.runInContext(readFileSync(resolve(__dirname, '../src/core/orientation.js'), 'utf8'), context);
  assert.ok(context.orientationClient.manager);
  assert.equal(context.orientationClient.manager, vm.runInContext('bleManager', context));
  assert.equal(elements['orientation-pitch-value'].textContent, '—');
});
