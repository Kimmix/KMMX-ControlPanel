/**
 * Utility Helper Functions
 * Centralized location for reusable utility functions
 */

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color string (with or without #)
 * @returns {object|null} RGB object {r, g, b} or null if invalid
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Convert RGB to hex color
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} Hex color string (uppercase with #)
 */
export function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Haptic feedback using device vibration
 * @param {string} pattern - Vibration pattern name (light, medium, heavy, success, error, long)
 */
export function vibrateDevice(pattern = 'light') {
    if (!navigator.vibrate) return;

    const patterns = {
        light: 30,           // Quick tap
        medium: 50,          // Button press
        heavy: 80,           // Important action
        success: [30, 80, 30], // Double tap
        error: [50, 120, 50, 120, 50], // Triple pulse
        long: 100            // Long press
    };

    navigator.vibrate(patterns[pattern] || patterns.light);
}

/**
 * Throttle and debounce utility
 * Combines throttling (limit call frequency) and debouncing (wait for pause)
 * @param {Function} func - Function to throttle/debounce
 * @param {number} throttleDelay - Throttle delay in ms
 * @param {number} debounceDelay - Debounce delay in ms
 * @returns {Function} Throttled and debounced function
 */
export function throttleAndDebounce(func, throttleDelay, debounceDelay) {
    let isThrottled = false;
    let lastCallTime = 0;
    let timeoutId;

    return function throttledAndDebounced(...args) {
        const currentTime = Date.now();

        // Throttle: Execute immediately if not throttled
        if (!isThrottled || currentTime - lastCallTime >= throttleDelay) {
            func.apply(this, args);
            lastCallTime = currentTime;
            isThrottled = true;
        }

        // Debounce: Execute after delay when calls stop
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
