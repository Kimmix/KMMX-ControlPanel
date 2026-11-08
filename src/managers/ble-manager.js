class BLECharacteristicManager {
  constructor() {
    this.characteristics = new Map();
    this.previousValues = new Map();
    this.writeQueue = [];
    this.isProcessing = false;
    this.pendingTimers = new Set();
    this.busy = false;
    this.generation = 0;
    this.throttledWrites = new Map(); // Store throttled write functions
  }

  register(name, characteristic, options = {}) {
    if (!characteristic) {
      console.warn(`Cannot register null characteristic: ${name}`);
      return;
    }

    const config = {
      char: characteristic,
      throttleMs: options.throttleMs || 100,
      debounceMs: options.debounceMs || 50,
      isColor: options.isColor || false,
      isTrigger: options.isTrigger || false // Trigger characteristics always write, even if value is same
    };

    this.characteristics.set(name, config);

    this.throttledWrites.set(name, this.throttleAndDebounce(
      (value) => this.write(name, value),
      config.throttleMs,
      config.debounceMs
    ));

    console.log(`✓ Registered BLE characteristic: ${name}`);
  }

  get(name) {
    return this.characteristics.get(name)?.char;
  }

  write(name, value) {
    const config = this.characteristics.get(name);

    if (!config?.char) {
      console.log(`Not connected - ${name} change skipped`);
      return;
    }

    const valueKey = Array.isArray(value) ? value.join(',') : value;
    const previousKey = this.previousValues.get(name);

    if (!config.isTrigger && valueKey === previousKey) {
      return;
    }

    if (!config.isTrigger) {
      this.previousValues.set(name, valueKey);
    }

    this.queueWrite(async () => {
      try {
        const byteArray = Array.isArray(value) ? value : [value];
        await config.char.writeValue(Uint8Array.of(...byteArray));

        if (config.isColor) {
          console.log(`> ${name} changed to: R=${value[0]} G=${value[1]} B=${value[2]}`);
        } else if (config.isTrigger) {
          console.log(`> ${name} triggered with: ${value}`);
        } else {
          console.log(`> ${name} changed to: ${value}`);
        }

      } catch (error) {
        console.error(`Error writing ${name}:`, error);
        throw error;
      }
    });
  }

  writeBuffer(name, buffer, value) {
    const characteristic = this.characteristics.get(name)?.char;
    if (!characteristic) return;

    this.queueWrite(async () => {
      try {
        await characteristic.writeValue(buffer);
        console.log(`> ${name} changed to: ${value}`);
      } catch (error) {
        console.error(`Error writing ${name}:`, error);
        throw error;
      }
    });
  }
  queueWrite(writeFunction) {
    this.enqueue(writeFunction).catch(error => {
      if (error.message !== 'Disconnected') console.error('BLE operation failed:', error);
    });
  }

  updateBusy() {
    const busy = this.isProcessing || this.writeQueue.length > 0 || this.pendingTimers.size > 0;
    if (busy === this.busy) return;
    this.busy = busy;
    window.dispatchEvent(new CustomEvent('ble-writing', { detail: busy }));
  }

  enqueue(operation, key) {
    const generation = this.generation;
    return new Promise((resolve, reject) => {
      if (key) {
        this.writeQueue = this.writeQueue.filter(item => {
          if (item.key !== key) return true;
          item.reject(new Error('Superseded'));
          return false;
        });
      }
      this.writeQueue.push({ operation, key, generation, resolve, reject });
      this.updateBusy();
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      while (this.writeQueue.length) {
        const item = this.writeQueue.shift();
        try {
          if (item.generation !== this.generation) throw new Error('Disconnected');
          const result = await item.operation();
          if (item.generation !== this.generation) throw new Error('Disconnected');
          item.resolve(result);
        } catch (error) {
          if (item.generation === this.generation && error.message !== 'Disconnected' && error.message !== 'Superseded')
            window.dispatchEvent(new CustomEvent('ble-error', { detail: error.message }));
          item.reject(error);
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } finally { this.isProcessing = false; this.updateBusy(); }
  }

  getThrottledWrite(name) {
    const throttledWrite = this.throttledWrites.get(name);
    if (!throttledWrite) {
      console.warn(`No throttled write function for characteristic: ${name}`);
      return () => {};
    }
    return throttledWrite;
  }

  throttleAndDebounce(func, throttleDelay, debounceDelay) {
    const generation = this.generation;
    const manager = this;
    let isThrottled = false;
    let lastCallTime = 0;
    let timeoutId;
    const pending = {};

    return function throttledAndDebounced(...args) {
      if (generation !== manager.generation) return;
      const currentTime = Date.now();

      if (!isThrottled || currentTime - lastCallTime >= throttleDelay) {
        func.apply(this, args);
        lastCallTime = currentTime;
        isThrottled = true;
      }

      manager.pendingTimers.add(pending);
      manager.updateBusy();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (generation !== manager.generation) return;
        manager.pendingTimers.delete(pending);
        isThrottled = false;
        if (Date.now() - lastCallTime >= debounceDelay) {
          func.apply(this, args);
          lastCallTime = Date.now();
        }
        manager.updateBusy();
      }, debounceDelay);
    };
  }

  clear() {
    ++this.generation;
    for (const item of this.writeQueue) item.reject(new Error('Disconnected'));
    this.writeQueue = [];
    this.pendingTimers.clear();
    this.updateBusy();
    this.characteristics.clear();
    this.previousValues.clear();
    this.throttledWrites.clear();
    console.log('BLE Manager cleared');
  }

}
const bleManager = new BLECharacteristicManager();

if (typeof module !== 'undefined') module.exports = BLECharacteristicManager;
