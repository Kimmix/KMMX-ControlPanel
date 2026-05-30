/**
 * BLE Characteristic Manager
 * Unified manager for all BLE characteristic operations
 * Handles writing, throttling, and previous value tracking
 */

class BLECharacteristicManager {
  constructor() {
    this.characteristics = new Map();
    this.previousValues = new Map();
    this.writeQueue = [];
    this.isProcessing = false;
    this.throttledWrites = new Map(); // Store throttled write functions
  }

  /**
   * Register a BLE characteristic with the manager
   * @param {string} name - Unique identifier for the characteristic
   * @param {BluetoothRemoteGATTCharacteristic} characteristic - The BLE characteristic object
   * @param {Object} options - Configuration options
   */
  register(name, characteristic, options = {}) {
    if (!characteristic) {
      console.warn(`Cannot register null characteristic: ${name}`);
      return;
    }

    const config = {
      char: characteristic,
      displayId: options.displayId || null,
      throttleMs: options.throttleMs || 100,
      debounceMs: options.debounceMs || 50,
      isColor: options.isColor || false,
      isTrigger: options.isTrigger || false // Trigger characteristics always write, even if value is same
    };

    this.characteristics.set(name, config);

    // Create throttled write function for this characteristic
    this.throttledWrites.set(name, this.throttleAndDebounce(
      (value) => this.write(name, value),
      config.throttleMs,
      config.debounceMs
    ));

    console.log(`✓ Registered BLE characteristic: ${name}`);
  }

  /**
   * Write a value to a registered characteristic
   * @param {string} name - Name of the registered characteristic
   * @param {number|Array} value - Value(s) to write (single byte or RGB array)
   */
  write(name, value) {
    const config = this.characteristics.get(name);

    if (!config?.char) {
      console.log(`Not connected - ${name} change skipped`);
      return;
    }

    // Create a key for comparing values
    const valueKey = Array.isArray(value) ? value.join(',') : value;
    const previousKey = this.previousValues.get(name);

    // Skip if value hasn't changed (unless it's a trigger characteristic)
    if (!config.isTrigger && valueKey === previousKey) {
      return;
    }

    // Update previous value (for non-trigger characteristics)
    if (!config.isTrigger) {
      this.previousValues.set(name, valueKey);
    }

    // Queue the write operation
    this.queueWrite(async () => {
      try {
        const byteArray = Array.isArray(value) ? value : [value];
        await config.char.writeValue(Uint8Array.of(...byteArray));

        // Log success
        if (config.isColor) {
          console.log(`> ${name} changed to: R=${value[0]} G=${value[1]} B=${value[2]}`);
        } else if (config.isTrigger) {
          console.log(`> ${name} triggered with: ${value}`);
        } else {
          console.log(`> ${name} changed to: ${value}`);
        }

        // Update display if displayId provided
        if (config.displayId) {
          this.updateDisplay(config.displayId, value, config.isColor);
        }
      } catch (error) {
        console.error(`Error writing ${name}:`, error);
      }
    });
  }

  /**
   * Queue a BLE write operation
   * @param {Function} writeFunction - Async function to execute
   */
  queueWrite(writeFunction) {
    this.writeQueue.push(writeFunction);
    this.processQueue();
  }

  /**
   * Process the write queue with delays to prevent GATT conflicts
   */
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
      // Delay between operations to prevent GATT conflicts
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isProcessing = false;
  }

  /**
   * Update the display element with the new value
   * @param {string} elementId - DOM element ID to update
   * @param {number|Array} value - Value to display
   * @param {boolean} isColor - Whether this is a color value
   */
  updateDisplay(elementId, value, isColor) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (isColor && Array.isArray(value)) {
      const [r, g, b] = value;
      const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      element.textContent = hexColor.toUpperCase();
      element.style.color = hexColor;
    } else {
      element.textContent = value;
    }
  }

  /**
   * Get the throttled write function for a characteristic
   * @param {string} name - Name of the characteristic
   * @returns {Function} Throttled write function
   */
  getThrottledWrite(name) {
    const throttledWrite = this.throttledWrites.get(name);
    if (!throttledWrite) {
      console.warn(`No throttled write function for characteristic: ${name}`);
      return () => {};
    }
    return throttledWrite;
  }

  /**
   * Throttle and debounce utility
   * @param {Function} func - Function to throttle/debounce
   * @param {number} throttleDelay - Throttle delay in ms
   * @param {number} debounceDelay - Debounce delay in ms
   * @returns {Function} Throttled and debounced function
   */
  throttleAndDebounce(func, throttleDelay, debounceDelay) {
    let isThrottled = false;
    let lastCallTime = 0;
    let timeoutId;

    return function throttledAndDebounced(...args) {
      const currentTime = Date.now();

      // Throttle
      if (!isThrottled || currentTime - lastCallTime >= throttleDelay) {
        func.apply(this, args);
        lastCallTime = currentTime;
        isThrottled = true;
      }

      // Debounce
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

  /**
   * Clear all stored values and queue (called on disconnect)
   */
  clear() {
    this.writeQueue = [];
    this.isProcessing = false;
    this.previousValues.clear();
    this.throttledWrites.clear();
    console.log('BLE Manager cleared');
  }

  /**
   * Check if a characteristic is registered and ready
   * @param {string} name - Name of the characteristic
   * @returns {boolean} True if characteristic is ready
   */
  isReady(name) {
    const config = this.characteristics.get(name);
    return config?.char != null;
  }
}

// Create global instance
const bleManager = new BLECharacteristicManager();
