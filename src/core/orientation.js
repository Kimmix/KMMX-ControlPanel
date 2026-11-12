(function (root) {
  'use strict';
  function decode(view) {
    if (view.byteLength !== 10 || view.getUint8(0) !== 2 || view.getUint8(1) > 2)
      throw new Error('Invalid orientation packet');
    const sample = { status: view.getUint8(1), pitch: view.getFloat32(2, true),
      roll: view.getFloat32(6, true) };
    if (sample.status === 2 && ![sample.pitch, sample.roll].every(Number.isFinite))
      throw new Error('Invalid orientation angles');
    return sample;
  }
  class Client {
    constructor(manager, changed = () => {}) {
      this.manager = manager; this.changed = changed; this.epoch = 0; this.disconnect();
    }
    show(message, sample = null) {
      this.message = message; this.sample = sample; this.changed(this);
    }
    disconnect() {
      ++this.epoch;
      clearTimeout(this.staleTimer);
      this.characteristic?.removeEventListener('characteristicvaluechanged', this.listener);
      this.characteristic = null;
      this.show('Connect to view head movement.');
    }
    receive(view) {
      clearTimeout(this.staleTimer);
      try {
        const sample = decode(view);
        this.show(['This device does not support head movement readings.', 'The movement sensor is unavailable.', 'Head movement'][sample.status],
          sample.status === 2 ? sample : null);
        this.staleTimer = setTimeout(() => this.show('Head movement readings are unavailable.'), 2000);
      } catch {
        this.show('Head movement readings are unavailable.');
      }
    }
    async connect() {
      this.disconnect();
      const epoch = this.epoch;
      const characteristic = this.manager.get('orientation');
      if (!characteristic) { this.show('Update your controller to view head movement.'); return; }
      this.characteristic = characteristic;
      this.show('Head movement readings are unavailable.');
      let enabled = false;
      this.listener = event => {
        if (epoch === this.epoch && enabled) this.receive(event.target.value);
      };
      try {
        await this.manager.enqueue(async () => {
          if (epoch !== this.epoch) return;
          characteristic.addEventListener('characteristicvaluechanged', this.listener);
          await characteristic.startNotifications();
          if (epoch !== this.epoch) return;
          enabled = true;
          const view = await characteristic.readValue();
          if (epoch === this.epoch) this.receive(view);
        });
      } catch {
        if (epoch !== this.epoch) return;
        enabled = false;
        characteristic.removeEventListener('characteristicvaluechanged', this.listener);
        clearTimeout(this.staleTimer);
        this.show('Head movement readings are unavailable.');
      }
    }
  }
  function render(client, document) {
    for (const [axis, limit] of [['pitch', 90], ['roll', 180]]) {
      const meter = document.getElementById(`orientation-${axis}`);
      const fill = meter.firstElementChild;
      const value = client.sample?.[axis];
      const ready = value !== undefined;
      document.getElementById(`orientation-${axis}-value`).textContent = ready ? `${value.toFixed(1)}°` : '—';
      if (ready) {
        const clamped = Math.max(-limit, Math.min(limit, value));
        const percent = 50 + clamped / limit * 50;
        meter.setAttribute('role', 'meter');
        meter.setAttribute('aria-valuemin', -limit);
        meter.setAttribute('aria-valuemax', limit);
        meter.setAttribute('aria-valuenow', clamped);
        meter.setAttribute('aria-valuetext', `${value.toFixed(1)} degrees`);
        fill.style.left = `${Math.min(50, percent)}%`;
        fill.style.width = `${Math.abs(percent - 50)}%`;
      } else {
        meter.setAttribute('role', 'group');
        meter.removeAttribute('aria-valuemin');
        meter.removeAttribute('aria-valuemax');
        meter.removeAttribute('aria-valuenow');
        meter.removeAttribute('aria-valuetext');
        fill.style.width = '0%';
      }
    }
  }
  const api = { Client, decode, render };
  if (typeof module !== 'undefined') module.exports = api;
  root.OrientationV2 = api;
  if (typeof document !== 'undefined' && document.getElementById('orientation-pitch'))
    root.orientationClient = new Client(bleManager, client => render(client, document));
})(globalThis);
