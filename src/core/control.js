// Import utilities
import { hexToRgb, rgbToHex, vibrateDevice } from '../utils/helpers.js';

import { expressions } from '../config/expressions.js';
import { mouthStates } from '../config/mouth-states.js';

// Make utilities globally available for non-module scripts
window.hexToRgb = hexToRgb;
window.rgbToHex = rgbToHex;
// vibrateDevice is already exported by app.js

// Functions that will be exposed globally for ble.js and HTML onclick handlers
let setExpression, setViseme, setMouthState;
let setHornLedBrightnessValue, setCheekPanelBrightnessValue;
let setCheekBgColorValue, setCheekFadeColorValue;
let setDisplayColorModeValue, setDisplayEffectColor1Value, setDisplayEffectColor2Value;
let setDisplayEffectOption1Value, setDisplayEffectOption2Value, setDisplayEffectOption3Value;
let setMotionEnableFlagsValue, setTapSensitivityValue, setGlitchIntensityValue;
let switchControlMode, toggleViseme, setDisplayColorMode, toggleDirectionInvert;
let resetCheekColors, resetDisplayColors, toggleMotionFeature, triggerGlitch;
let setFanSpeedValue, setFanEnabledValue, setFanRPMValue, setFanConnectedValue;
let toggleFan, updateFanControlVisibility;

//* --------- Expression ---------
// Expression definitions imported from config/expressions.js

// Create expression buttons using ButtonGrid component
const expressionGrid = new ButtonGrid({
    containerId: 'exp-btn',
    items: expressions,
    buttonClass: 'exp-btn',
    countElementId: 'expBtnCount',
    initialActiveIndex: 0,
    onClick: (item) => {
        window.writeBLE('eyeState', item.id);
        updateEyeStateDisplay(item.name);
        vibrateDevice();
    }
});

setExpression = function(i) {
    expressionGrid.setActiveById(i);
    const item = expressions.find(({ id }) => id === i);
    if (item) {
        window.writeBLE('eyeState', item.id);
        updateEyeStateDisplay(item.name);
        vibrateDevice();
    }
};
window.setExpression = setExpression;

function updateEyeStateDisplay(name) {
    const currentEyeState = document.getElementById('currentEyeState');
    if (currentEyeState) {
        currentEyeState.textContent = name;
    }
}

//* --------- Control Mode Switching ---------
let currentControlMode = 'eye'; // 'eye' or 'mouth'

switchControlMode = function(mode) {
    // If clicking the same mode, just provide feedback and keep it active
    if (currentControlMode === mode) {
        vibrateDevice();
        return;
    }

    currentControlMode = mode;

    // Update status item highlighting (the clickable status cards)
    const eyeStatus = document.querySelector('.eye-status');
    const mouthStatus = document.querySelector('.mouth-status');

    if (mode === 'eye') {
        eyeStatus.classList.add('active');
        mouthStatus.classList.remove('active');
    } else {
        eyeStatus.classList.remove('active');
        mouthStatus.classList.add('active');
    }

    // Switch control sections
    const eyeSection = document.getElementById('eyeControlSection');
    const mouthSection = document.getElementById('mouthControlSection');

    if (mode === 'eye') {
        eyeSection.classList.add('active');
        mouthSection.classList.remove('active');
    } else {
        eyeSection.classList.remove('active');
        mouthSection.classList.add('active');
    }

    // Provide haptic feedback
    vibrateDevice();
};
window.switchControlMode = switchControlMode;

//* --------- Mouth State ---------
// Mouth state definitions imported from config/mouth-states.js

// Create mouth state buttons using ButtonGrid component
const mouthStateGrid = new ButtonGrid({
    containerId: 'mouthStateButtons',
    items: mouthStates,
    buttonClass: 'mouth-state-btn',
    initialActiveIndex: 0,
    onClick: (item) => {
        window.writeBLE('mouthState', item.id);
        updateMouthStateDisplay(item.name);
        vibrateDevice();
    }
});

setMouthState = function(state) {
    mouthStateGrid.setActiveById(state);
    const item = mouthStates.find(s => s.id === state);
    if (item) {
        window.writeBLE('mouthState', state);
        updateMouthStateDisplay(item.name);
        vibrateDevice();
    }
};
window.setMouthState = setMouthState;

function updateMouthStateDisplay(name) {
    const currentMouthState = document.getElementById('currentMouthState');
    if (currentMouthState) {
        currentMouthState.textContent = name;
    }
}

//* --------- Viseme ---------
const visemeBtn = document.getElementById('visemeBtn');
const visemeOn = document.getElementById('visemeOn');
const visemeOff = document.getElementById('visemeOff');

function renderViseme(enabled) {
    visemeBtn.classList.toggle('active', enabled);
    visemeBtn.setAttribute('aria-pressed', enabled);
    visemeOn.classList.toggle('active', enabled);
    visemeOff.classList.toggle('active', !enabled);
    document.querySelectorAll('#mouthStateButtons button').forEach(button => button.disabled = enabled);
    document.getElementById('mouthStateButtons')?.classList.toggle('disabled', enabled);
    updateVisemeAdvancedVisibility();
}

toggleViseme = function() {
    const enabled = !isVisemeOn();
    renderViseme(enabled);
    window.writeBLE('viseme', enabled ? 1 : 0);
    vibrateDevice();
};
window.toggleViseme = toggleViseme;

// BLE synchronization updates the UI without writing the value back.
setViseme = function(value) {
    renderViseme(value !== 0);
};
window.setViseme = setViseme;

function isVisemeOn() {
    return visemeBtn.classList.contains('active')
}

window.openVisemeSettings = function() {
    document.querySelector('.nav-icon[data-page="settings"]')?.click();
    const section = document.getElementById('visemeAdvancedSection');
    const content = document.getElementById('visemeAdvancedContent');
    const button = document.getElementById('visemeAdvancedToggleBtn');
    section.style.display = 'block';
    content.style.display = 'block';
    button.classList.add('expanded');
    button.querySelector('.toggle-icon').style.transform = 'rotate(180deg)';
    setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
};

//* --------- Viseme Advanced Parameters ---------
// Toggle Advanced Section
window.toggleVisemeAdvanced = function() {
    const content = document.getElementById('visemeAdvancedContent');
    const button = document.getElementById('visemeAdvancedToggleBtn');
    const icon = button?.querySelector('.toggle-icon');

    if (!content) {
        console.error('visemeAdvancedContent not found');
        return;
    }

    // Toggle the display
    const isCurrentlyVisible = content.style.display !== 'none';

    if (isCurrentlyVisible) {
        content.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
        if (button) button.classList.remove('expanded');
    } else {
        content.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(180deg)';
        if (button) button.classList.add('expanded');
    }

    vibrateDevice();
};

// Show/hide advanced section based on viseme state
function updateVisemeAdvancedVisibility() {
    const advancedSection = document.getElementById('visemeAdvancedSection');
    if (advancedSection) advancedSection.style.display = isVisemeOn() ? 'block' : 'none';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderViseme(isVisemeOn());
});

[
    ['EnvelopeAttack', 2],
    ['EnvelopeRelease', 2],
    ['AttackThreshold', 1],
    ['MinSeparation', 1],
    ['NoiseFloorMin', 0],
    ['NoiseFloorMax', 0],
    ['NoiseAdaptSpeed', 4],
    ['AHScale', 1],
    ['EEScale', 1],
    ['OHScale', 1],
    ['OOScale', 1],
    ['THScale', 1]
].forEach(([name, decimals]) => {
    const slider = document.getElementById(`viseme${name}Slider`);
    const display = document.getElementById(`viseme${name}Value`);
    slider?.addEventListener('input', (event) => {
        const position = parseFloat(event.target.value);
        const value = event.target.dataset.nonlinear === 'noise-floor'
            ? 5 * Math.pow(40, position / 100)
            : position;
        if (display) display.textContent = value.toFixed(decimals);
        vibrateDevice();
        window.throttledVisemeFloatWriters[name](value);
    });
});

window.setVisemeNoiseFloorSlider = (name, value) => {
    const slider = document.getElementById(`viseme${name}Slider`);
    if (slider) slider.value = Math.log(Math.max(5, Math.min(200, value)) / 5) / Math.log(40) * 100;
};

//* --------- Horn LED Brightness ---------
//* --------- Horn LED Brightness Slider ---------
const hornLedSlider = new Slider({
    sliderId: 'hornLedValue',
    dotsContainerId: 'horn-dots-container',
    valueDisplayId: 'hornLedSliderValue',
    type: 'dots',
    maxValue: 100,
    onChange: (value) => {
        throttledAndDebouncedSetHornLedBrightness(value);
    }
});

// Function to set value from BLE
setHornLedBrightnessValue = function(value) {
    hornLedSlider.setValue(value);
};
window.setHornLedBrightnessValue = setHornLedBrightnessValue;

//* --------- Cheek Panel Brightness Slider ---------
const cheekPanelSlider = new Slider({
    sliderId: 'cheekPanelValue',
    dotsContainerId: 'cheek-dots-container',
    valueDisplayId: 'cheekPanelSliderValue',
    type: 'dots',
    maxValue: 255,
    convertToPercentage: true,
    onChange: (value) => {
        throttledAndDebouncedSetCheekPanelBrightness(value);
    }
});

// Function to set value from BLE
setCheekPanelBrightnessValue = function(value) {
    cheekPanelSlider.setValue(value);
};
window.setCheekPanelBrightnessValue = setCheekPanelBrightnessValue;

//* --------- Cheek Panel Color Controls ---------
const bgColorPicker = document.getElementById('bgColorPicker');
const fadeColorPicker = document.getElementById('fadeColorPicker');
const bgColorHex = document.getElementById('bgColorHex');
const fadeColorHex = document.getElementById('fadeColorHex');

// Background color picker handler
if (bgColorPicker) {
    bgColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        if (bgColorHex) bgColorHex.textContent = color.toUpperCase();
        const rgb = hexToRgb(color);
        if (rgb) {
            throttledAndDebouncedSetCheekBgColor(rgb.r, rgb.g, rgb.b);
            vibrateDevice();
        }
    });
}

// Fade color picker handler
if (fadeColorPicker) {
    fadeColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        if (fadeColorHex) fadeColorHex.textContent = color.toUpperCase();
        const rgb = hexToRgb(color);
        if (rgb) {
            throttledAndDebouncedSetCheekFadeColor(rgb.r, rgb.g, rgb.b);
            vibrateDevice();
        }
    });
}

// Event delegation for all color preset buttons (cheek panel colors)
// Attach a single listener to the document and filter by class
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-preset-btn:not([data-target^="gradient"])');
    if (!btn) return;

    const color = btn.getAttribute('data-color');
    const target = btn.getAttribute('data-target');

    if (target === 'bg' && bgColorPicker) {
        bgColorPicker.value = color;
        if (bgColorHex) bgColorHex.textContent = color.toUpperCase();
        const rgb = hexToRgb(color);
        if (rgb) {
            throttledAndDebouncedSetCheekBgColor(rgb.r, rgb.g, rgb.b);
        }
    } else if (target === 'fade' && fadeColorPicker) {
        fadeColorPicker.value = color;
        if (fadeColorHex) fadeColorHex.textContent = color.toUpperCase();
        const rgb = hexToRgb(color);
        if (rgb) {
            throttledAndDebouncedSetCheekFadeColor(rgb.r, rgb.g, rgb.b);
        }
    }
    vibrateDevice();
});

// Set color values from BLE (called when connecting to device)
setCheekBgColorValue = function(r, g, b) {
    const hex = rgbToHex(r, g, b);
    if (bgColorPicker) bgColorPicker.value = hex;
    if (bgColorHex) bgColorHex.textContent = hex;
};
window.setCheekBgColorValue = setCheekBgColorValue;

setCheekFadeColorValue = function(r, g, b) {
    const hex = rgbToHex(r, g, b);
    if (fadeColorPicker) fadeColorPicker.value = hex;
    if (fadeColorHex) fadeColorHex.textContent = hex;
};
window.setCheekFadeColorValue = setCheekFadeColorValue;

// Reset colors to default values
resetCheekColors = function() {
    const defaultBgColor = '#FF446C';  // Default pink
    const defaultFadeColor = '#F9826C';  // Default coral

    // Update background color
    if (bgColorPicker) bgColorPicker.value = defaultBgColor;
    if (bgColorHex) bgColorHex.textContent = defaultBgColor;
    const bgRgb = hexToRgb(defaultBgColor);
    if (bgRgb) {
        throttledAndDebouncedSetCheekBgColor(bgRgb.r, bgRgb.g, bgRgb.b);
    }

    // Update fade color
    if (fadeColorPicker) fadeColorPicker.value = defaultFadeColor;
    if (fadeColorHex) fadeColorHex.textContent = defaultFadeColor;
    const fadeRgb = hexToRgb(defaultFadeColor);
    if (fadeRgb) {
        throttledAndDebouncedSetCheekFadeColor(fadeRgb.r, fadeRgb.g, fadeRgb.b);
    }

    // Haptic feedback
    vibrateDevice();
};
window.resetCheekColors = resetCheekColors;

//* --------- Hub75 Display Color Controls ---------
const gradientTopColorPicker = document.getElementById('gradientTopColorPicker');
const gradientBottomColorPicker = document.getElementById('gradientBottomColorPicker');
const gradientTopColorHex = document.getElementById('gradientTopColorHex');
const gradientBottomColorHex = document.getElementById('gradientBottomColorHex');
const gradientTopColorLabel = document.getElementById('gradientTopColorLabel');
const gradientBottomColorLabel = document.getElementById('gradientBottomColorLabel');
const gradientPreview = document.getElementById('gradientPreview');
const gradientPreviewTitle = document.getElementById('gradientPreviewTitle');
const customGradientColors = document.getElementById('customGradientColors');
const displayColorModeGradient = document.getElementById('displayColorModeGradient');
const displayColorModeSpiral = document.getElementById('displayColorModeSpiral');
const displayColorModePlasma = document.getElementById('displayColorModePlasma');
const displayColorModeRadial = document.getElementById('displayColorModeRadial');
const displayColorModeDualSpiral = document.getElementById('displayColorModeDualSpiral');
const displayColorModeDualCircle = document.getElementById('displayColorModeDualCircle');
const dualSpiralThicknessControl = document.getElementById('dualSpiralThicknessControl');
const dualSpiralThicknessSlider = document.getElementById('dualSpiralThicknessSlider');
const dualCircleThicknessControl = document.getElementById('dualCircleThicknessControl');
const dualCircleThicknessSlider = document.getElementById('dualCircleThicknessSlider');
const directionInvertControl = document.getElementById('directionInvertControl');
const directionInvertToggle = document.getElementById('directionInvertToggle');
const directionInvertText = document.getElementById('directionInvertText');
const gradientBottomColorContainer = document.getElementById('gradientBottomColorContainer');
const gradientPreviewContainer = document.getElementById('gradientPreviewContainer');

const displayModeButtons = [
    displayColorModeGradient,
    displayColorModeSpiral,
    displayColorModePlasma,
    displayColorModeRadial,
    displayColorModeDualSpiral,
    displayColorModeDualCircle
];

function updateDisplayModeUI(mode) {
    const showColors = mode === 0 || mode === 4 || mode === 5;
    const showOptions = mode === 4 || mode === 5;
    const shape = mode === 4 ? 'Spiral' : mode === 5 ? 'Circle' : 'Gradient';

    displayModeButtons.forEach((button, index) => button?.classList.toggle('active', index === mode));
    if (customGradientColors) customGradientColors.style.display = showColors ? 'block' : 'none';
    if (gradientBottomColorContainer) gradientBottomColorContainer.style.display = showColors ? 'block' : 'none';
    if (gradientPreviewContainer) gradientPreviewContainer.style.display = mode === 0 ? 'block' : 'none';
    if (dualSpiralThicknessControl) dualSpiralThicknessControl.style.display = showOptions ? 'block' : 'none';
    if (dualCircleThicknessControl) dualCircleThicknessControl.style.display = showOptions ? 'block' : 'none';
    if (directionInvertControl) directionInvertControl.style.display = showOptions ? 'block' : 'none';
    if (gradientTopColorLabel) gradientTopColorLabel.textContent = mode === 0 ? 'Top Gradient Color' : `Primary ${shape} Color`;
    if (gradientBottomColorLabel) gradientBottomColorLabel.textContent = mode === 0 ? 'Bottom Gradient Color' : `Secondary ${shape} Color`;
}

// Event delegation for display mode buttons
// Map button IDs to mode values
const displayModeButtonMap = {
    'displayColorModeGradient': 0,
    'displayColorModeSpiral': 1,
    'displayColorModePlasma': 2,
    'displayColorModeRadial': 3,
    'displayColorModeDualSpiral': 4,
    'displayColorModeDualCircle': 5
};

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.display-color-mode-btn');
    if (!btn || !btn.id || !(btn.id in displayModeButtonMap)) return;

    const mode = displayModeButtonMap[btn.id];
    setDisplayColorMode(mode);
});

// Set display color mode (called when user changes mode)
setDisplayColorMode = function(mode) {
    // Update BLE characteristic
    window.writeBLE('displayColorMode', mode);

    updateDisplayModeUI(mode);

    // Provide haptic feedback
    vibrateDevice();
};
window.setDisplayColorMode = setDisplayColorMode;

// Set color mode value from BLE (called when connecting to device)
setDisplayColorModeValue = function(mode) {
    updateDisplayModeUI(mode);
};
window.setDisplayColorModeValue = setDisplayColorModeValue;

function updateGradientPreview(topColor, bottomColor, mode = null) {
    if (mode === null) {
        mode = displayModeButtons.findIndex(button => button?.classList.contains('active'));
    }
    if (mode !== 0 || !gradientPreview) return;
    gradientPreview.style.background = `linear-gradient(to bottom, ${topColor}, ${bottomColor})`;
    if (gradientPreviewTitle) gradientPreviewTitle.textContent = 'Preview';
}

// Effect Color 1 (top/gradient/spiral/circle color) picker handler
gradientTopColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    gradientTopColorHex.textContent = color.toUpperCase();
    const rgb = hexToRgb(color);
    if (rgb) {
        throttledAndDebouncedSetDisplayEffectColor1(rgb.r, rgb.g, rgb.b);
        updateGradientPreview(color, gradientBottomColorPicker.value);
        vibrateDevice();
    }
});

// Effect Color 2 (bottom gradient color) picker handler
gradientBottomColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    gradientBottomColorHex.textContent = color.toUpperCase();
    const rgb = hexToRgb(color);
    if (rgb) {
        throttledAndDebouncedSetDisplayEffectColor2(rgb.r, rgb.g, rgb.b);
        updateGradientPreview(gradientTopColorPicker.value, color);
        vibrateDevice();
    }
});

// Event delegation for display effect color preset buttons
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-preset-btn[data-target^="gradient"]');
    if (!btn) return;

    const color = btn.getAttribute('data-color');
    const target = btn.getAttribute('data-target');

    if (target === 'gradientTop') {
        gradientTopColorPicker.value = color;
        gradientTopColorHex.textContent = color.toUpperCase();
        const rgb = hexToRgb(color);
        if (rgb) {
            throttledAndDebouncedSetDisplayEffectColor1(rgb.r, rgb.g, rgb.b);
            updateGradientPreview(color, gradientBottomColorPicker.value);
        }
    } else if (target === 'gradientBottom') {
        gradientBottomColorPicker.value = color;
        gradientBottomColorHex.textContent = color.toUpperCase();
        const rgb = hexToRgb(color);
        if (rgb) {
            throttledAndDebouncedSetDisplayEffectColor2(rgb.r, rgb.g, rgb.b);
            updateGradientPreview(gradientTopColorPicker.value, color);
        }
    }
    vibrateDevice();
});

// Set display effect color values from BLE (called when connecting to device)
setDisplayEffectColor1Value = function(r, g, b) {
    const hex = rgbToHex(r, g, b);
    gradientTopColorPicker.value = hex;
    gradientTopColorHex.textContent = hex;
    updateGradientPreview(hex, gradientBottomColorPicker.value);
};
window.setDisplayEffectColor1Value = setDisplayEffectColor1Value;

setDisplayEffectColor2Value = function(r, g, b) {
    const hex = rgbToHex(r, g, b);
    gradientBottomColorPicker.value = hex;
    gradientBottomColorHex.textContent = hex;
    updateGradientPreview(gradientTopColorPicker.value, hex);
};
window.setDisplayEffectColor2Value = setDisplayEffectColor2Value;

// Reset display colors to default values
resetDisplayColors = function() {
    const defaultTopColor = '#FFA393';  // Light peachy pink (RGB: 255, 163, 147)
    const defaultBottomColor = '#FF2B5B';  // Deep pink/red (RGB: 255, 43, 91)
    const defaultMode = 0;  // Gradient mode

    // Reset to default mode
    setDisplayColorMode(defaultMode);

    // Update effect color 1 (top gradient color)
    gradientTopColorPicker.value = defaultTopColor;
    gradientTopColorHex.textContent = defaultTopColor;
    const topRgb = hexToRgb(defaultTopColor);
    if (topRgb) {
        throttledAndDebouncedSetDisplayEffectColor1(topRgb.r, topRgb.g, topRgb.b);
    }

    // Update effect color 2 (bottom gradient color)
    gradientBottomColorPicker.value = defaultBottomColor;
    gradientBottomColorHex.textContent = defaultBottomColor;
    const bottomRgb = hexToRgb(defaultBottomColor);
    if (bottomRgb) {
        throttledAndDebouncedSetDisplayEffectColor2(bottomRgb.r, bottomRgb.g, bottomRgb.b);
    }

    // Update preview
    updateGradientPreview(defaultTopColor, defaultBottomColor);

    // Haptic feedback
    vibrateDevice();
};
window.resetDisplayColors = resetDisplayColors;

//* --------- Display Effect Option Controls ---------
//* --------- Display Effect Option 1 Slider (Thickness) ---------
// Option1 is used for Thickness in modes 4 (Dual Spiral) and 5 (Dual Circle)
const displayEffectOption1Slider = dualSpiralThicknessSlider ? new Slider({
    sliderId: 'dualSpiralThicknessSlider',
    valueDisplayId: 'spiralThicknessValue',
    type: 'gradient',
    maxValue: 255,
    onChange: (value) => {
        throttledAndDebouncedSetDisplayEffectOption1(value);
    }
}) : null;

// Set Display Effect Option 1 value from BLE (called when connecting to device)
setDisplayEffectOption1Value = function(value) {
    if (displayEffectOption1Slider) {
        displayEffectOption1Slider.setValue(value);
    }
};
window.setDisplayEffectOption1Value = setDisplayEffectOption1Value;

//* --------- Display Effect Option 2 Slider (Speed) ---------
// Option2 is used for Speed in modes 4 (Dual Spiral) and 5 (Dual Circle)
const displayEffectOption2Slider = dualCircleThicknessSlider ? new Slider({
    sliderId: 'dualCircleThicknessSlider',
    valueDisplayId: 'circleThicknessValue',
    type: 'gradient',
    maxValue: 255,
    onChange: (value) => {
        throttledAndDebouncedSetDisplayEffectOption2(value);
    }
}) : null;

// Set Display Effect Option 2 value from BLE (called when connecting to device)
setDisplayEffectOption2Value = function(value) {
    if (displayEffectOption2Slider) {
        displayEffectOption2Slider.setValue(value);
    }
};
window.setDisplayEffectOption2Value = setDisplayEffectOption2Value;

// Effect Option 3 (Direction/Invert) toggle function
toggleDirectionInvert = function() {
    const checkbox = document.getElementById('directionInvertToggle');
    const isInverted = checkbox.checked;
    const value = isInverted ? 1 : 0;

    // Update text label
    if (directionInvertText) {
        directionInvertText.textContent = isInverted ? 'Inverted' : 'Normal';
    }

    // Send to BLE
    window.writeBLE('displayEffectOption3', value);
    vibrateDevice();
};
window.toggleDirectionInvert = toggleDirectionInvert;

// Set Display Effect Option 3 value from BLE (called when connecting to device)
// Option3 is used for Direction/Invert in modes 4 (Dual Spiral) and 5 (Dual Circle)
setDisplayEffectOption3Value = function(value) {
    const checkbox = document.getElementById('directionInvertToggle');
    if (checkbox && directionInvertText) {
        checkbox.checked = (value === 1);
        directionInvertText.textContent = (value === 1) ? 'Inverted' : 'Normal';
    }
};
window.setDisplayEffectOption3Value = setDisplayEffectOption3Value;

// --------- Motion Detection & Glitch Control ---------

// Motion feature state (bit flags)
let motionEnableFlags = 0x0F; // All features enabled by default (binary: 1111)

// Event delegation for motion feature buttons
// Map button IDs to feature bit positions
const motionFeatureButtonMap = {
    'tapDetectionBtn': 0,
    'pettingDetectionBtn': 1,
    'tiltDetectionBtn': 2,
    'upsideDownDetectionBtn': 3,
    'boopToggleBtn': 4
};

document.addEventListener('click', (e) => {
    const btn = e.target.closest('#tapDetectionBtn, #pettingDetectionBtn, #tiltDetectionBtn, #upsideDownDetectionBtn, #boopToggleBtn');
    if (!btn || !btn.id || !(btn.id in motionFeatureButtonMap)) return;

    const featureBit = motionFeatureButtonMap[btn.id];
    toggleMotionFeature(featureBit);
});

// Toggle individual motion feature
toggleMotionFeature = function(featureBit) {
    // Toggle the bit
    motionEnableFlags ^= (1 << featureBit);

    // Update UI
    updateMotionFeatureUI(featureBit);

    // Send to BLE
    window.writeBLE('motionEnableFlags', motionEnableFlags);

    // Haptic feedback
    vibrateDevice();

    console.log(`Motion feature ${featureBit} toggled. New flags: 0x${motionEnableFlags.toString(16)}`);
};
window.toggleMotionFeature = toggleMotionFeature;

// Update motion feature button UI
function updateMotionFeatureUI(featureBit) {
    const buttons = [
        document.getElementById('tapDetectionBtn'),
        document.getElementById('pettingDetectionBtn'),
        document.getElementById('tiltDetectionBtn'),
        document.getElementById('upsideDownDetectionBtn'),
        document.getElementById('boopToggleBtn')
    ];

    if (buttons[featureBit]) {
        const isEnabled = (motionEnableFlags & (1 << featureBit)) !== 0;
        if (isEnabled) {
            buttons[featureBit].classList.add('active');
        } else {
            buttons[featureBit].classList.remove('active');
        }
    }
}

// Set motion enable flags value from BLE (called when connecting to device)
setMotionEnableFlagsValue = function(value) {
    motionEnableFlags = value;

    // Update all button states
    for (let i = 0; i < 5; i++) {
        updateMotionFeatureUI(i);
    }

    console.log(`Motion enable flags set to: 0x${motionEnableFlags.toString(16)}`);
};
window.setMotionEnableFlagsValue = setMotionEnableFlagsValue;

const tapSensitivitySlider = new Slider({
    sliderId: 'tapSensitivitySlider',
    valueDisplayId: 'tapSensitivityValue',
    type: 'gradient',
    valueSuffix: '%',
    onChange: value => throttledAndDebouncedSetTapSensitivity(value)
});

setTapSensitivityValue = value => tapSensitivitySlider.setValue(value);
window.setTapSensitivityValue = setTapSensitivityValue;

const glitchIntensitySlider = new Slider({
    sliderId: 'glitchIntensitySlider',
    valueDisplayId: 'glitchIntensityValue',
    type: 'gradient',
    valueSuffix: '%',
    onChange: value => throttledAndDebouncedSetGlitchIntensity(value)
});

setGlitchIntensityValue = value => glitchIntensitySlider.setValue(value);
window.setGlitchIntensityValue = setGlitchIntensityValue;

new Slider({
    sliderId: 'manualGlitchIntensitySlider',
    valueDisplayId: 'manualGlitchIntensityValue',
    type: 'gradient',
    valueSuffix: '%'
});
const manualGlitchIntensitySlider = document.getElementById('manualGlitchIntensitySlider');

// Trigger Glitch Effect
triggerGlitch = function() {
    const intensity = manualGlitchIntensitySlider ? parseInt(manualGlitchIntensitySlider.value) : 50;

    // Send glitch trigger to BLE
    window.writeBLE('glitchTrigger', intensity);

    // Visual feedback - pulse animation
    const btn = document.getElementById('triggerGlitchBtn');
    if (btn) {
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 150);
    }

    // Haptic feedback
    vibrateDevice();

    console.log(`Glitch triggered with intensity: ${intensity}`);
};
window.triggerGlitch = triggerGlitch;

//* --------- Fan Control (V4 Only) ---------
let fanEnabled = false;
let fanSpeed = 0;

function renderFan() {
    const fanOnBtn = document.getElementById('fanOn');
    const fanOffBtn = document.getElementById('fanOff');
    const fanIcon = document.getElementById('fanIcon');
    const fanSpeedSlider = document.getElementById('fanSpeedSlider');
    const fanSpeedContainer = document.getElementById('fanSpeedSliderContainer');
    fanOnBtn?.classList.toggle('active', fanEnabled);
    fanOffBtn?.classList.toggle('active', !fanEnabled);
    if (fanSpeedSlider) fanSpeedSlider.disabled = !fanEnabled;
    if (fanSpeedContainer) fanSpeedContainer.style.opacity = fanEnabled ? '1' : '0.5';
    if (fanIcon) {
        const rotationSpeed = Math.max(0.2, 2 - (fanSpeed / 50));
        fanIcon.style.animation = fanEnabled && fanSpeed > 0 ? `fan-spin ${rotationSpeed}s linear infinite` : 'none';
    }
}

// Toggle fan on/off
toggleFan = function() {
    fanEnabled = !fanEnabled;
    renderFan();
    window.writeBLE('fanEnabled', fanEnabled ? 1 : 0);
    vibrateDevice();
    console.log(`Fan ${fanEnabled ? 'enabled' : 'disabled'}`);
};
window.toggleFan = toggleFan;

// Set fan speed from slider
document.addEventListener('DOMContentLoaded', function() {
    const fanSpeedSlider = document.getElementById('fanSpeedSlider');
    const fanSpeedValue = document.getElementById('fanSpeedValue');

    if (fanSpeedSlider && fanSpeedValue) {
        fanSpeedSlider.addEventListener('input', function() {
            const speed = parseInt(this.value);
            fanSpeed = speed;
            fanSpeedValue.textContent = speed;
            renderFan();
        });
        fanSpeedSlider.addEventListener('change', () => window.writeBLE('fanSpeed', fanSpeed));
    }
});

// Initialize fan speed value (called from BLE when connection established)
setFanSpeedValue = function(value) {
    fanSpeed = value;
    const fanSpeedSlider = document.getElementById('fanSpeedSlider');
    const fanSpeedValue = document.getElementById('fanSpeedValue');

    if (fanSpeedSlider) fanSpeedSlider.value = value;
    if (fanSpeedValue) fanSpeedValue.textContent = value;

    console.log(`Fan speed set to: ${value}%`);
};
window.setFanSpeedValue = setFanSpeedValue;

// Initialize fan enabled state (called from BLE when connection established)
setFanEnabledValue = function(value) {
    fanEnabled = value === 1;
    renderFan();
    console.log(`Fan enabled state set to: ${fanEnabled}`);
};
window.setFanEnabledValue = setFanEnabledValue;

// Update RPM display (called from BLE notification)
setFanRPMValue = function(rpm) {
    const fanRPMValue = document.getElementById('fanRPMValue');
    if (fanRPMValue) {
        fanRPMValue.textContent = rpm;
    }
};
window.setFanRPMValue = setFanRPMValue;

// Update connection status (called from BLE notification)
setFanConnectedValue = function(connected) {
    const fanConnectionDot = document.getElementById('fanConnectionDot');
    const fanConnectionText = document.getElementById('fanConnectionText');

    if (fanConnectionDot) {
        fanConnectionDot.className = connected ? 'connection-dot connected' : 'connection-dot disconnected';
    }
    if (fanConnectionText) {
        fanConnectionText.textContent = connected ? 'Connected' : 'Disconnected';
    }

    console.log(`Fan connection status: ${connected ? 'Connected' : 'Disconnected'}`);
};
window.setFanConnectedValue = setFanConnectedValue;

// Show/hide fan control section based on hardware version
updateFanControlVisibility = function(isAvailable) {
    const fanControlSection = document.getElementById('fanControlSection');
    if (fanControlSection) {
        fanControlSection.style.display = isAvailable ? 'block' : 'none';
        console.log(`Fan control ${isAvailable ? 'available (V4 hardware)' : 'not available (V2 hardware)'}`);
    }
};
window.updateFanControlVisibility = updateFanControlVisibility;
