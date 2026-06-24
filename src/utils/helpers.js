export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

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
