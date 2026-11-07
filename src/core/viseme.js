(function (root) {
  'use strict';
  const names = ['visemeSettings', 'visemeCalibration', 'visemeStatus'];
  function valid(s) {
    return Number.isFinite(s.threshold) && s.threshold >= 1 && s.threshold <= 1000 &&
      Number.isFinite(s.gain) && s.gain >= 0.25 && s.gain <= 4 && Number.isInteger(s.response) && s.response >= 0 && s.response <= 2;
  }
  function encodeSettings(s) {
    if (!valid(s)) throw new Error('Invalid lip-sync settings');
    const view = new DataView(new ArrayBuffer(10));
    view.setUint8(0, 2); view.setFloat32(1, s.threshold, true); view.setFloat32(5, s.gain, true); view.setUint8(9, s.response);
    return view.buffer;
  }
  function decodeSettings(view) {
    if (view.byteLength !== 10 || view.getUint8(0) !== 2) throw new Error('Update firmware to tune lip sync.');
    const s = { threshold: view.getFloat32(1, true), gain: view.getFloat32(5, true), response: view.getUint8(9) };
    if (!valid(s)) throw new Error('Invalid settings received. Reconnect to retry.');
    return s;
  }
  function decodeStatus(v) {
    if (v.byteLength !== 16 || v.getUint8(0) !== 3) throw new Error('Update firmware to tune lip sync.');
    const s = { accepted: v.getUint16(1, true), applied: v.getUint16(3, true),
      rms: v.getFloat32(5, true), gate: v.getUint8(9), shape: v.getUint8(10), opening: v.getUint8(11),
      calibration: v.getUint8(12), progress: v.getUint8(13), mic: v.getUint8(14), result: v.getUint8(15) };
    if (!Number.isFinite(s.rms) || s.rms < 0 || s.gate > 1 || s.shape > 4 || s.opening > 60 ||
        s.calibration > 5 || s.progress > 100 || s.mic > 2 || s.result > 6)
      throw new Error('Invalid lip-sync status. Reconnect to retry.');
    return s;
  }
  const same = (a, b) => a && b && a.threshold === b.threshold && a.gain === b.gain && a.response === b.response;
  const busy = s => s && (s.calibration === 1 || s.calibration === 2);
  const fromSlider = (t, low, high) => low * Math.pow(high / low, t / 100);
  const toSlider = (v, low, high) => Math.max(0, Math.min(100, 100 * Math.log(v / low) / Math.log(high / low)));
  class Client {
    constructor(manager, changed = () => {}) { this.manager = manager; this.changed = changed; this.epoch = 0; this.request = 0; this.disconnect(); }
    disconnect() {
      ++this.epoch; ++this.request;
      clearInterval(this.poll);
      this.characteristic?.removeEventListener('characteristicvaluechanged', this.listener);
      this.characteristic = null; this.confirmed = null; this.status = null; this.supported = false; this.pending = false;
      this.error = 'Connect to tune lip sync.';
      this.changed(this);
    }
    async connect() {
      this.disconnect();
      const epoch = this.epoch;
      if (!names.every(name => this.manager.get(name))) { this.error = 'Update firmware to tune lip sync.'; this.changed(this); return; }
      try {
        await this.manager.enqueue(async () => {
          const settings = decodeSettings(await this.manager.get(names[0]).readValue());
          if (epoch !== this.epoch) return;
          const status = decodeStatus(await this.manager.get(names[2]).readValue());
          if (epoch !== this.epoch) return;
          this.confirmed = settings; this.status = status;
          this.characteristic = this.manager.get(names[2]);
          this.listener = event => {
            if (epoch !== this.epoch) return;
            try { this.receive(decodeStatus(event.target.value)); }
            catch (error) { this.error = error.message; this.supported = false; this.changed(this); }
          };
          this.characteristic.addEventListener('characteristicvaluechanged', this.listener);
          try { await this.characteristic.startNotifications(); }
          catch {
            if (epoch === this.epoch) this.poll = setInterval(() => this.refresh().catch(() => {}), 1000);
          }
          if (epoch !== this.epoch) return;
          this.supported = true; this.error = ''; this.changed(this);
        });
      } catch (error) { if (epoch === this.epoch) { this.error = error.message; this.changed(this); } }
    }
    receive(status) {
      const changed = this.status && (this.status.accepted !== status.accepted || this.status.calibration !== status.calibration);
      this.status = status; this.changed(this);
      if (changed && !this.pending) this.refresh().catch(() => {});
    }
    async refresh() {
      const epoch = this.epoch;
      try {
        await this.manager.enqueue(async () => {
          if (epoch !== this.epoch) return;
          const settings = decodeSettings(await this.manager.get(names[0]).readValue());
          if (epoch !== this.epoch) return;
          const status = decodeStatus(await this.manager.get(names[2]).readValue());
          if (epoch !== this.epoch) return;
          this.confirmed = settings; this.status = status; this.changed(this);
        }, 'viseme-refresh');
      } catch (error) { if (epoch === this.epoch && error.message !== 'Superseded') { this.error = error.message; this.changed(this); } }
    }
    async submit(settings) {
      if (!this.supported || busy(this.status)) return;
      const bytes = encodeSettings(settings), expected = decodeSettings(new DataView(bytes));
      const epoch = this.epoch, request = ++this.request;
      this.pending = true; this.error = ''; this.changed(this);
      try {
        await this.manager.enqueue(async () => {
          if (epoch !== this.epoch) return;
          const characteristic = this.manager.get(names[0]);
          await characteristic.writeValue(bytes);
          if (epoch !== this.epoch) return;
          const actual = decodeSettings(await characteristic.readValue());
          if (epoch !== this.epoch) return;
          const status = decodeStatus(await this.manager.get(names[2]).readValue());
          if (epoch !== this.epoch) return;
          this.confirmed = actual; this.status = status;
          if (!same(actual, expected) || status.result === 1 || status.result === 2)
            throw new Error('Settings were not applied. Wait for calibration to finish, then retry.');
        }, 'viseme-settings');
      } catch (error) {
        if (epoch === this.epoch && request === this.request) this.error = `Could not apply settings: ${error.message}`;
      } finally {
        if (epoch === this.epoch && request === this.request) { this.pending = false; this.changed(this); }
      }
    }
    async calibrate(command) {
      if (!this.supported || this.pending) return;
      const epoch = this.epoch;
      this.pending = true; this.error = ''; this.changed(this);
      try {
        await this.manager.enqueue(async () => {
          if (epoch !== this.epoch) return;
          await this.manager.get(names[1]).writeValue(Uint8Array.of(command));
          if (epoch !== this.epoch) return;
          const status = decodeStatus(await this.manager.get(names[2]).readValue());
          if (epoch !== this.epoch) return;
          const settings = decodeSettings(await this.manager.get(names[0]).readValue());
          if (epoch !== this.epoch) return;
          this.status = status; this.confirmed = settings;
        });
      } catch (error) { if (epoch === this.epoch) this.error = `Calibration command failed: ${error.message}`; }
      finally { if (epoch === this.epoch) { this.pending = false; this.changed(this); } }
    }
  }
  const api = { Client, encodeSettings, decodeSettings, decodeStatus, fromSlider, toSlider, busy };
  if (typeof module !== 'undefined') module.exports = api;
  root.VisemeV2 = api;
})(globalThis);
