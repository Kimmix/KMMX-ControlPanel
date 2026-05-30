// Import utilities
import { hexToRgb, rgbToHex, vibrateDevice } from './utils/helpers.js';

// Import configurations
import { expressions } from './config/expressions.js';
import { mouthStates } from './config/mouth-states.js';
import { displayModeNames } from './config/display-modes.js';

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
        setEyeStateCharacteristic(item.id);
        updateEyeStateDisplay(item.name);
        vibrateDevice();
    }
});

setExpression = function(i) {
    expressionGrid.setActiveById(i);
    const item = expressions.find(({ id }) => id === i);
    if (item) {
        setEyeStateCharacteristic(item.id);
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
        setMouthStateCharacteristic(item.id);
        updateMouthStateDisplay(item.name);
        vibrateDevice();
    }
});

setMouthState = function(state) {
    mouthStateGrid.setActiveById(state);
    const item = mouthStates.find(s => s.id === state);
    if (item) {
        setMouthStateCharacteristic(state);
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
const visemeSilder = document.getElementById('vsmSlider');
toggleViseme = function() {
    visemeBtn.classList.toggle('active');
    visemeOn.classList.toggle('active');
    visemeOff.classList.toggle('active');
    visemeSilder.classList.toggle('disable');
    vibrateDevice();
    updateViseme();
};
window.toggleViseme = toggleViseme;

setViseme = function(i) {
    if (i && !isVisemeOn()) {
        toggleViseme();
    } else if (!i && isVisemeOn()) {
        toggleViseme();
    }
};
window.setViseme = setViseme;

function updateViseme() {
    if (isVisemeOn()) {
        setVisemeCharacteristic(1);
    } else {
        setVisemeCharacteristic(0);
    }
}

//* Visme slider
const sliderNumbers = document.querySelectorAll('.sliderNumber');
const rangeInput = document.getElementById('vsmValue');

rangeInput.addEventListener('input', () => {
    const inputValue = parseInt(rangeInput.value, 10);

    sliderNumbers.forEach((number, index) => {
        if (index + 1 === inputValue) {
            number.classList.add('active');
        } else {
            number.classList.remove('active');
        }
    });
    vibrateDevice();
    throttledAndDebouncedsetVisemeCharacteristic(inputValue + 1);
});

function isVisemeOn() {
    return visemeBtn.classList.contains('active')
}

//* --------- Matrix Brightness - Disabled ---------
// function createDots(numDots) {
//     const dotsContainer = document.getElementById('dots-container');
//     for (let i = 0; i < numDots; i++) {
//         const dot = document.createElement('div');
//         dot.className = 'dot';
//         dotsContainer.appendChild(dot);
//     }
// }

// function renderTotalDots() {
//     const deviceWidth = window.innerWidth;
//     const numDots = Math.floor(deviceWidth / 30); // Adjust as needed
//     const dotsContainer = document.getElementById('dots-container');
//     dotsContainer.innerHTML = ''; // Clear previous dots
//     createDots(numDots);
// }
// renderTotalDots(); // On page load

// let dotValueInput = document.getElementById('dotValue');
// function setBrightnessvalue(i) {
//     dotValueInput.value = i;
//     renderWhiteDots(dotValueInput.value);
// }

// dotValueInput.addEventListener('input', () => {
//     let value = dotValueInput.value
//     renderWhiteDots(value);
//     throttledAndDebouncedSetDisplayBrightness(value);
// });

// let prevNumOfWhiteDots = 0;
// function renderWhiteDots(value, firstTime) {
//     const dotsContainer = document.getElementById('dots-container');
//     let dots = dotsContainer.querySelectorAll('.dot');
//     const numOfWhiteDots = Math.ceil((value / 100) * dots.length);
//     if ((numOfWhiteDots !== prevNumOfWhiteDots) && !firstTime) {
//         vibrateDevice();
//         prevNumOfWhiteDots = numOfWhiteDots;
//     }
//     dots.forEach((dot, index) => {
//         if (index < numOfWhiteDots) {
//             dot.classList.add('white-dot');
//         } else {
//             dot.classList.remove('white-dot');
//         }
//     });
//     const sliderValueElement = document.getElementById('sliderValue');
//     sliderValueElement.textContent = value;
// }

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

//* --------- Consolidated Resize Handler ---------
// Resize handling is now managed by individual Slider components

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

// Color preset buttons handler
document.querySelectorAll('.color-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
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

// Display mode names imported from config/display-modes.js

// Initialize Display Mode Manager
const displayModeManager = new DisplayModeManager({
    modeButtons: [
        displayColorModeGradient,
        displayColorModeSpiral,
        displayColorModePlasma,
        displayColorModeRadial,
        displayColorModeDualSpiral,
        displayColorModeDualCircle
    ],
    customGradientColors,
    gradientBottomColorContainer,
    gradientTopColorLabel,
    gradientBottomColorLabel,
    gradientPreview,
    gradientPreviewTitle,
    gradientPreviewContainer,
    gradientTopColorPicker,
    gradientBottomColorPicker,
    dualSpiralThicknessControl,
    dualCircleThicknessControl,
    directionInvertControl
});

// Set display color mode (called when user changes mode)
setDisplayColorMode = function(mode) {
    // Update BLE characteristic
    setDisplayColorModeCharacteristic(mode);

    // Update UI using DisplayModeManager
    displayModeManager.updateUI(mode);

    // Provide haptic feedback
    vibrateDevice();
};
window.setDisplayColorMode = setDisplayColorMode;

// Set color mode value from BLE (called when connecting to device)
setDisplayColorModeValue = function(mode) {
    // Update UI using DisplayModeManager (no BLE write, no haptic feedback)
    displayModeManager.updateUI(mode);
};
window.setDisplayColorModeValue = setDisplayColorModeValue;

// Update gradient preview (wrapper for DisplayModeManager)
function updateGradientPreview(topColor, bottomColor, mode = null) {
    // If mode is not provided, get current active mode from manager
    if (mode === null) {
        mode = displayModeManager.getCurrentMode();
    }

    // Use the manager's updatePreview method
    displayModeManager.updatePreview(mode);
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

// Color preset buttons handler for display effect colors
document.querySelectorAll('.color-preset-btn[data-target^="gradient"]').forEach(btn => {
    btn.addEventListener('click', () => {
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
    setDisplayEffectOption3Characteristic(value);
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

// Motion feature bit positions
const MOTION_FLAGS = {
    TAP_DETECTION: 0,      // Bit 0 (0x01)
    PETTING_DETECTION: 1,  // Bit 1 (0x02)
    TILT_DETECTION: 2,     // Bit 2 (0x04)
    UPSIDE_DOWN: 3         // Bit 3 (0x08)
};

// Toggle individual motion feature
toggleMotionFeature = function(featureBit) {
    // Toggle the bit
    motionEnableFlags ^= (1 << featureBit);

    // Update UI
    updateMotionFeatureUI(featureBit);

    // Send to BLE
    setMotionEnableFlagsCharacteristic(motionEnableFlags);

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
        document.getElementById('upsideDownDetectionBtn')
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
    for (let i = 0; i < 4; i++) {
        updateMotionFeatureUI(i);
    }

    console.log(`Motion enable flags set to: 0x${motionEnableFlags.toString(16)}`);
};
window.setMotionEnableFlagsValue = setMotionEnableFlagsValue;

// Tap Sensitivity slider
const tapSensitivitySlider = document.getElementById('tapSensitivitySlider');
const tapSensitivityValue = document.getElementById('tapSensitivityValue');

if (tapSensitivitySlider && tapSensitivityValue) {
    tapSensitivitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        updateTapSensitivitySlider(value);

        // Send to BLE with throttle/debounce
        throttledAndDebouncedSetTapSensitivity(value);

        vibrateDevice();
    });
}

// Update tap sensitivity slider display
function updateTapSensitivitySlider(value) {
    if (tapSensitivityValue) {
        tapSensitivityValue.textContent = value + '%';
    }

    // Update slider fill
    if (tapSensitivitySlider) {
        const min = parseInt(tapSensitivitySlider.min) || 0;
        const max = parseInt(tapSensitivitySlider.max) || 100;
        const percentage = ((value - min) / (max - min)) * 100;
        tapSensitivitySlider.style.background = `linear-gradient(to right, white 0%, white ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
    }
}

// Set tap sensitivity value from BLE (called when connecting to device)
setTapSensitivityValue = function(value) {
    if (tapSensitivitySlider && tapSensitivityValue) {
        tapSensitivitySlider.value = value;
        updateTapSensitivitySlider(value);
    }
};
window.setTapSensitivityValue = setTapSensitivityValue;

// Glitch Intensity slider (for automatic glitches)
const glitchIntensitySlider = document.getElementById('glitchIntensitySlider');
const glitchIntensityValue = document.getElementById('glitchIntensityValue');

if (glitchIntensitySlider && glitchIntensityValue) {
    glitchIntensitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        updateGlitchIntensitySlider(value);

        // Send to BLE with throttle/debounce
        throttledAndDebouncedSetGlitchIntensity(value);

        vibrateDevice();
    });
}

// Update glitch intensity slider display
function updateGlitchIntensitySlider(value) {
    if (glitchIntensityValue) {
        glitchIntensityValue.textContent = value + '%';
    }

    // Update slider fill
    if (glitchIntensitySlider) {
        const min = parseInt(glitchIntensitySlider.min) || 0;
        const max = parseInt(glitchIntensitySlider.max) || 100;
        const percentage = ((value - min) / (max - min)) * 100;
        glitchIntensitySlider.style.background = `linear-gradient(to right, white 0%, white ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
    }
}

// Set glitch intensity value from BLE (called when connecting to device)
setGlitchIntensityValue = function(value) {
    if (glitchIntensitySlider && glitchIntensityValue) {
        glitchIntensitySlider.value = value;
        updateGlitchIntensitySlider(value);
    }
};
window.setGlitchIntensityValue = setGlitchIntensityValue;

// Manual Glitch Intensity slider (for trigger button)
const manualGlitchIntensitySlider = document.getElementById('manualGlitchIntensitySlider');
const manualGlitchIntensityValue = document.getElementById('manualGlitchIntensityValue');

if (manualGlitchIntensitySlider && manualGlitchIntensityValue) {
    manualGlitchIntensitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        updateManualGlitchIntensitySlider(value);
        vibrateDevice();
    });

    // Initialize display with current slider value
    updateManualGlitchIntensitySlider(parseInt(manualGlitchIntensitySlider.value));
}

// Update manual glitch intensity slider display
function updateManualGlitchIntensitySlider(value) {
    if (manualGlitchIntensityValue) {
        manualGlitchIntensityValue.textContent = value + '%';
    }

    // Update slider fill
    if (manualGlitchIntensitySlider) {
        const min = parseInt(manualGlitchIntensitySlider.min) || 0;
        const max = parseInt(manualGlitchIntensitySlider.max) || 100;
        const percentage = ((value - min) / (max - min)) * 100;
        manualGlitchIntensitySlider.style.background = `linear-gradient(to right, white 0%, white ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
    }
}

// Trigger Glitch Effect
triggerGlitch = function() {
    const intensity = manualGlitchIntensitySlider ? parseInt(manualGlitchIntensitySlider.value) : 50;

    // Send glitch trigger to BLE
    setGlitchTriggerCharacteristic(intensity);

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
