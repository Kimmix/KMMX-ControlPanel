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
let setFanSpeedValue, updateFanControlVisibility;

function createButtonGrid({ containerId, items, buttonClass = 'exp-btn', countElementId, initialActiveIndex, onClick }) {
    const container = document.getElementById(containerId);
    let activeButton = null;

    const setActive = buttonId => {
        const button = document.getElementById(buttonId);
        if (!button) return;
        activeButton?.classList.remove('active');
        button.classList.add('active');
        activeButton = button;
    };

    document.getElementById(countElementId)?.replaceChildren(String(items.length));
    container?.replaceChildren(...items.map(item => {
        const button = document.createElement('button');
        button.id = item.buttonId;
        button.className = `btn-base ${buttonClass}${item.src ? '' : ' placeholder'}`;
        button.title = item.name;
        button.type = 'button';
        button.addEventListener('click', () => {
            setActive(item.buttonId);
            onClick?.(item);
        });

        if (item.src) {
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.name;
            button.appendChild(img);
        } else {
            const text = document.createElement('span');
            text.className = 'placeholder-text';
            text.textContent = item.name;
            button.appendChild(text);
        }
        return button;
    }));

    if (initialActiveIndex !== undefined && items[initialActiveIndex]) {
        setActive(items[initialActiveIndex].buttonId);
    }

    return {
        setActiveById(id) {
            setActive((items.find(item => item.id === id) || items[0])?.buttonId);
        }
    };
}

function bindSlider({ sliderId, dotsContainerId, valueDisplayId, type = 'dots', maxValue = 100, onChange, vibrate = true, convertToPercentage = false, valueSuffix = '' }) {
    const slider = document.getElementById(sliderId);
    const dotsContainer = dotsContainerId ? document.getElementById(dotsContainerId) : null;
    const valueDisplay = valueDisplayId ? document.getElementById(valueDisplayId) : null;
    let previousDotCount = 0;

    const renderDots = (value, firstTime) => {
        if (!dotsContainer) return;
        const dots = [...dotsContainer.querySelectorAll('.dot')];
        const filled = Math.ceil((value / maxValue) * dots.length);
        if (filled !== previousDotCount && !firstTime && vibrate) vibrateDevice();
        previousDotCount = filled;
        dots.forEach((dot, index) => dot.classList.toggle('white-dot', index < filled));
    };

    const render = (value, firstTime = false) => {
        if (type === 'dots') {
            renderDots(value, firstTime);
        } else if (slider) {
            const min = parseInt(slider.min) || 0;
            const max = parseInt(slider.max) || 255;
            const percentage = ((value - min) / (max - min)) * 100;
            slider.style.background = `linear-gradient(to right, white 0%, white ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
        }

        if (valueDisplay) {
            const displayValue = convertToPercentage ? Math.round((value / maxValue) * 100) : value;
            valueDisplay.textContent = `${displayValue}${valueSuffix}`;
        }
    };

    const rebuildDots = () => {
        if (!dotsContainer) return;
        dotsContainer.replaceChildren(...Array.from({ length: Math.floor(window.innerWidth / 30) }, () => {
            const dot = document.createElement('div');
            dot.className = 'dot';
            return dot;
        }));
        render(parseInt(slider.value) || 0, true);
    };

    if (type === 'dots') {
        rebuildDots();
        window.addEventListener('resize', rebuildDots);
    }

    slider?.addEventListener('input', event => {
        const value = parseInt(event.target.value);
        render(value);
        onChange?.(value);
        if (vibrate) vibrateDevice();
    });

    render(parseInt(slider?.value) || 0, true);
    return {
        setValue(value) {
            if (slider) slider.value = value;
            render(value, true);
        }
    };
}

function applyColor(picker, label, color, write, after) {
    if (picker) picker.value = color;
    if (label) label.textContent = color.toUpperCase();
    const rgb = hexToRgb(color);
    if (!rgb) return;
    write?.(rgb.r, rgb.g, rgb.b);
    after?.(color);
}

function bindColorInput(picker, label, write, after) {
    picker?.addEventListener('input', event => {
        applyColor(picker, label, event.target.value, write, after);
        vibrateDevice();
    });
}

function bindColorPresets(selector, targets) {
    document.addEventListener('click', event => {
        const btn = event.target.closest(selector);
        if (!btn) return;
        const target = targets[btn.dataset.target];
        if (!target) return;
        applyColor(target[0], target[1], btn.dataset.color, target[2], target[3]);
        vibrateDevice();
    });
}

//* --------- Expression ---------

const expressionGrid = createButtonGrid({
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
    if (item) updateEyeStateDisplay(item.name);
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

const mouthStateGrid = createButtonGrid({
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
    if (item) updateMouthStateDisplay(item.name);
};
window.setMouthState = setMouthState;

function updateMouthStateDisplay(name) {
    const currentMouthState = document.getElementById('currentMouthState');
    if (currentMouthState) {
        currentMouthState.textContent = name;
    }
}

//* --------- Slot Machine ---------
const slotMachineBtn = document.getElementById('slotMachineBtn');

function renderSlotMachine(enabled) {
    slotMachineBtn?.classList.toggle('active', enabled);
    slotMachineBtn?.setAttribute('aria-pressed', enabled);
    document.getElementById('slotMachineState')?.replaceChildren(enabled ? 'On — boop to spin' : 'Off');
}

window.toggleSlotMachine = function() {
    const enabled = !slotMachineBtn?.classList.contains('active');
    renderSlotMachine(enabled);
    window.writeBLE('slotMachineEnable', enabled ? 1 : 0);
    vibrateDevice();
};

window.setSlotMachineEnabledValue = value => renderSlotMachine(value !== 0);

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
    window.bleVisemeValue = enabled ? 1 : 0;
    renderViseme(enabled);
    window.writeBLE('viseme', window.bleVisemeValue);
    vibrateDevice();
};
window.toggleViseme = toggleViseme;

// BLE synchronization updates the UI without writing the value back.
setViseme = function(value) {
    window.bleVisemeValue = value;
    renderViseme(value !== 0);
};
window.setViseme = setViseme;

function isVisemeOn() {
    return visemeBtn.classList.contains('active')
}

window.openVisemeSettings = function() {
    document.querySelector('.nav-icon[data-page="settings"]')?.click();
    expandSettingsSection(document.getElementById('audioProcessingSection'));
    const section = document.getElementById('visemeAdvancedSection');
    const content = document.getElementById('visemeAdvancedContent');
    section.style.display = 'block';
    content.style.display = 'flex';
    setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
};

//* --------- Viseme Advanced Parameters ---------
function updateVisemeAdvancedVisibility() {
    const advancedSection = document.getElementById('visemeAdvancedSection');
    if (advancedSection) advancedSection.style.display = 'block';
}

function expandSettingsSection(section) {
    section?.classList.remove('collapsed');
    section?.querySelector(':scope > h3.section-title')?.setAttribute('aria-expanded', 'true');
}

function setupSettingsAccordions() {
    document.querySelectorAll('#page-settings .settings-section > h3.section-title').forEach(title => {
        const section = title.parentElement;
        if (!section || section.querySelector(':scope > .settings-section-content')) return;

        const content = document.createElement('div');
        content.className = 'settings-section-content';
        while (title.nextSibling) content.appendChild(title.nextSibling);
        section.appendChild(content);

        title.tabIndex = 0;
        title.setAttribute('role', 'button');
        title.setAttribute('aria-expanded', 'true');

        const toggle = () => {
            section.classList.toggle('collapsed');
            title.setAttribute('aria-expanded', String(!section.classList.contains('collapsed')));
            vibrateDevice();
        };
        title.addEventListener('click', toggle);
        title.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            toggle();
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupSettingsAccordions();
    renderViseme(window.bleVisemeValue === undefined ? isVisemeOn() : window.bleVisemeValue !== 0);
});

const visemeParameterUI = {
    EnvelopeAttack: [2, t => 0.1 + t * 0.8, value => (value - 0.1) / 0.8],
    EnvelopeRelease: [2, t => 0.01 * Math.pow(50, t), value => Math.log(value / 0.01) / Math.log(50)],
    NoiseGateMultiplier: [2, t => 1 + 2 * t * t, value => Math.sqrt((value - 1) / 2)],
    NoiseFloorMin: [1, t => 5 * Math.pow(40, t), value => Math.log(value / 5) / Math.log(40)],
    AHScale: [2, t => 0.1 * Math.pow(50, t), value => Math.log(value / 0.1) / Math.log(50)],
    EEScale: [2, t => 0.1 * Math.pow(50, t), value => Math.log(value / 0.1) / Math.log(50)],
    OHScale: [2, t => 0.1 * Math.pow(50, t), value => Math.log(value / 0.1) / Math.log(50)],
    OOScale: [2, t => 0.1 * Math.pow(50, t), value => Math.log(value / 0.1) / Math.log(50)],
    THScale: [2, t => 0.1 * Math.pow(50, t), value => Math.log(value / 0.1) / Math.log(50)],
    LoudnessExponent: [2, t => 0.2 * Math.pow(10, t), value => Math.log(value / 0.2) / Math.log(10)],
    LoudnessSmoothing: [2, t => 0.05 + t * 0.95, value => (value - 0.05) / 0.95],
    LoudnessMax: [2, t => Math.pow(20, t), value => Math.log(value) / Math.log(20)],
    LoudnessMidBoost: [2, t => 0.5 + t * 1.5, value => (value - 0.5) / 1.5]
};

Object.entries(visemeParameterUI).forEach(([name, [decimals, fromSlider]]) => {
    const slider = document.getElementById(`viseme${name}Slider`);
    const display = document.getElementById(`viseme${name}Value`);
    slider?.addEventListener('input', (event) => {
        const value = fromSlider(parseFloat(event.target.value) / 100);
        if (display) display.textContent = value.toFixed(decimals);
        vibrateDevice();
        window.throttledVisemeFloatWriters[name](value);
    });
});

window.setVisemeParameterSlider = (name, value) => {
    const slider = document.getElementById(`viseme${name}Slider`);
    const toSlider = visemeParameterUI[name]?.[2];
    if (slider && toSlider) slider.value = Math.max(0, Math.min(100, toSlider(value) * 100));
};

const visemeDefaults = {
    EnvelopeAttack: 0.5,
    EnvelopeRelease: 0.4,
    NoiseGateMultiplier: 1.2,
    NoiseFloorMin: 5,
    AHScale: 3.3,
    EEScale: 1.3,
    OHScale: 1.5,
    OOScale: 1.4,
    THScale: 1,
    LoudnessExponent: 0.8,
    LoudnessSmoothing: 0.65,
    LoudnessMax: 5,
    LoudnessMidBoost: 1.2
};

const visemeSections = {
    envelope: ['EnvelopeAttack', 'EnvelopeRelease'],
    noiseFloor: ['NoiseFloorMin', 'NoiseGateMultiplier'],
    sensitivity: ['AHScale', 'EEScale', 'OHScale', 'OOScale', 'THScale'],
    loudness: ['LoudnessExponent', 'LoudnessSmoothing', 'LoudnessMax', 'LoudnessMidBoost']
};

window.resetVisemeSection = section => {
    visemeSections[section].forEach(name => {
        const value = visemeDefaults[name];
        const decimals = visemeParameterUI[name][0];
        window.setVisemeParameterSlider(name, value);
        document.getElementById(`viseme${name}Value`).textContent = value.toFixed(decimals);
        window.throttledVisemeFloatWriters?.[name](value);
    });
    vibrateDevice();
};

//* --------- Horn LED Brightness ---------
//* --------- Horn LED Brightness Slider ---------
const hornLedSlider = bindSlider({
    sliderId: 'hornLedValue',
    dotsContainerId: 'horn-dots-container',
    valueDisplayId: 'hornLedSliderValue',
    type: 'dots',
    maxValue: 100,
    onChange: (value) => {
        window.throttledAndDebouncedSetHornLedBrightness?.(value);
    }
});

// Function to set value from BLE
setHornLedBrightnessValue = function(value) {
    hornLedSlider.setValue(value);
};
window.setHornLedBrightnessValue = setHornLedBrightnessValue;

//* --------- Cheek Panel Brightness Slider ---------
const cheekPanelSlider = bindSlider({
    sliderId: 'cheekPanelValue',
    dotsContainerId: 'cheek-dots-container',
    valueDisplayId: 'cheekPanelSliderValue',
    type: 'dots',
    maxValue: 255,
    convertToPercentage: true,
    onChange: (value) => {
        window.throttledAndDebouncedSetCheekPanelBrightness?.(value);
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
const writeCheekBgColor = (r, g, b) => window.throttledAndDebouncedSetCheekBgColor?.(r, g, b);
const writeCheekFadeColor = (r, g, b) => window.throttledAndDebouncedSetCheekFadeColor?.(r, g, b);

bindColorInput(bgColorPicker, bgColorHex, writeCheekBgColor);
bindColorInput(fadeColorPicker, fadeColorHex, writeCheekFadeColor);
bindColorPresets('.color-preset-btn:not([data-target^="gradient"])', {
    bg: [bgColorPicker, bgColorHex, writeCheekBgColor],
    fade: [fadeColorPicker, fadeColorHex, writeCheekFadeColor]
});

// Set color values from BLE (called when connecting to device)
setCheekBgColorValue = function(r, g, b) {
    applyColor(bgColorPicker, bgColorHex, rgbToHex(r, g, b));
};
window.setCheekBgColorValue = setCheekBgColorValue;

setCheekFadeColorValue = function(r, g, b) {
    applyColor(fadeColorPicker, fadeColorHex, rgbToHex(r, g, b));
};
window.setCheekFadeColorValue = setCheekFadeColorValue;

// Reset colors to default values
resetCheekColors = function() {
    applyColor(bgColorPicker, bgColorHex, '#FF446C', writeCheekBgColor);
    applyColor(fadeColorPicker, fadeColorHex, '#F9826C', writeCheekFadeColor);
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
const writeDisplayEffectColor1 = (r, g, b) => window.throttledAndDebouncedSetDisplayEffectColor1?.(r, g, b);
const writeDisplayEffectColor2 = (r, g, b) => window.throttledAndDebouncedSetDisplayEffectColor2?.(r, g, b);

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

bindColorInput(
    gradientTopColorPicker,
    gradientTopColorHex,
    writeDisplayEffectColor1,
    color => updateGradientPreview(color, gradientBottomColorPicker.value)
);
bindColorInput(
    gradientBottomColorPicker,
    gradientBottomColorHex,
    writeDisplayEffectColor2,
    color => updateGradientPreview(gradientTopColorPicker.value, color)
);
bindColorPresets('.color-preset-btn[data-target^="gradient"]', {
    gradientTop: [
        gradientTopColorPicker,
        gradientTopColorHex,
        writeDisplayEffectColor1,
        color => updateGradientPreview(color, gradientBottomColorPicker.value)
    ],
    gradientBottom: [
        gradientBottomColorPicker,
        gradientBottomColorHex,
        writeDisplayEffectColor2,
        color => updateGradientPreview(gradientTopColorPicker.value, color)
    ]
});

// Set display effect color values from BLE (called when connecting to device)
setDisplayEffectColor1Value = function(r, g, b) {
    const hex = rgbToHex(r, g, b);
    applyColor(gradientTopColorPicker, gradientTopColorHex, hex, null, color => updateGradientPreview(color, gradientBottomColorPicker.value));
};
window.setDisplayEffectColor1Value = setDisplayEffectColor1Value;

setDisplayEffectColor2Value = function(r, g, b) {
    const hex = rgbToHex(r, g, b);
    applyColor(gradientBottomColorPicker, gradientBottomColorHex, hex, null, color => updateGradientPreview(gradientTopColorPicker.value, color));
};
window.setDisplayEffectColor2Value = setDisplayEffectColor2Value;

// Reset display colors to default values
resetDisplayColors = function() {
    setDisplayColorMode(0);
    applyColor(gradientTopColorPicker, gradientTopColorHex, '#FFA393', writeDisplayEffectColor1);
    applyColor(gradientBottomColorPicker, gradientBottomColorHex, '#FF2B5B', writeDisplayEffectColor2);
    updateGradientPreview('#FFA393', '#FF2B5B');
    vibrateDevice();
};
window.resetDisplayColors = resetDisplayColors;

//* --------- Display Effect Option Controls ---------
//* --------- Display Effect Option 1 Slider (Thickness) ---------
// Option1 is used for Thickness in modes 4 (Dual Spiral) and 5 (Dual Circle)
const displayEffectOption1Slider = dualSpiralThicknessSlider ? bindSlider({
    sliderId: 'dualSpiralThicknessSlider',
    valueDisplayId: 'spiralThicknessValue',
    type: 'gradient',
    maxValue: 255,
    onChange: (value) => {
        window.throttledAndDebouncedSetDisplayEffectOption1?.(value);
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
const displayEffectOption2Slider = dualCircleThicknessSlider ? bindSlider({
    sliderId: 'dualCircleThicknessSlider',
    valueDisplayId: 'circleThicknessValue',
    type: 'gradient',
    maxValue: 255,
    onChange: (value) => {
        window.throttledAndDebouncedSetDisplayEffectOption2?.(value);
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

const tapSensitivitySlider = bindSlider({
    sliderId: 'tapSensitivitySlider',
    valueDisplayId: 'tapSensitivityValue',
    type: 'gradient',
    valueSuffix: '%',
    onChange: value => window.throttledAndDebouncedSetTapSensitivity?.(value)
});

setTapSensitivityValue = value => tapSensitivitySlider.setValue(value);
window.setTapSensitivityValue = setTapSensitivityValue;

const glitchIntensitySlider = bindSlider({
    sliderId: 'glitchIntensitySlider',
    valueDisplayId: 'glitchIntensityValue',
    type: 'gradient',
    valueSuffix: '%',
    onChange: value => window.throttledAndDebouncedSetGlitchIntensity?.(value)
});

setGlitchIntensityValue = value => glitchIntensitySlider.setValue(value);
window.setGlitchIntensityValue = setGlitchIntensityValue;

bindSlider({
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

//* --------- Fan Control ---------
let fanSpeed = 0;

function renderFan() {
    const fanCard = document.querySelector('.fan-control-card');
    const fanIcon = document.getElementById('fanIcon');
    const fanStateText = document.getElementById('fanStateText');
    if (fanCard) fanCard.style.setProperty('--fan-speed', `${fanSpeed}%`);
    if (fanStateText) fanStateText.textContent = fanSpeed > 0 ? 'Running' : 'Off';
    if (fanIcon) {
        const rotationSpeed = Math.max(0.2, 2 - (fanSpeed / 50));
        fanIcon.style.animation = fanSpeed > 0 ? `fan-spin ${rotationSpeed}s linear infinite` : 'none';
    }
}

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
    renderFan();

    console.log(`Fan speed set to: ${value}%`);
};
window.setFanSpeedValue = setFanSpeedValue;

// Show/hide fan control section based on BLE availability
updateFanControlVisibility = function(isAvailable) {
    const fanControlSection = document.getElementById('fanControlSection');
    if (fanControlSection) {
        fanControlSection.style.display = isAvailable ? 'block' : 'none';
        console.log(`Fan control ${isAvailable ? 'available' : 'not available'}`);
    }
};
window.updateFanControlVisibility = updateFanControlVisibility;
