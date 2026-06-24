class BLECharacteristicManager {
  constructor() {
    this.characteristics = new Map();
    this.previousValues = new Map();
    this.writeQueue = [];
    this.isProcessing = false;
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
      }
    });
  }
  queueWrite(writeFunction) {
    this.writeQueue.push(writeFunction);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.writeQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.writeQueue.length > 0) {
      const writeOperation = this.writeQueue.shift();
      try {
        await writeOperation();
      } catch (error) {
        console.error('BLE write error:', error);
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isProcessing = false;
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
    let isThrottled = false;
    let lastCallTime = 0;
    let timeoutId;

    return function throttledAndDebounced(...args) {
      const currentTime = Date.now();

      if (!isThrottled || currentTime - lastCallTime >= throttleDelay) {
        func.apply(this, args);
        lastCallTime = currentTime;
        isThrottled = true;
      }

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        isThrottled = false;
        if (Date.now() - lastCallTime >= debounceDelay) {
          func.apply(this, args);
          lastCallTime = Date.now();
        }
      }, debounceDelay);
    };
  }

  clear() {
    this.writeQueue = [];
    this.isProcessing = false;
    this.characteristics.clear();
    this.previousValues.clear();
    this.throttledWrites.clear();
    console.log('BLE Manager cleared');
  }

}
const bleManager = new BLECharacteristicManager();
