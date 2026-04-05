
//* --------- Expression ---------
const expression = [
    {
        id: 0,
        buttonId: 'button0',
        name: 'Idle',
        src: 'asset/svg/expression/default.svg',
    },
    {
        id: 1,
        buttonId: 'button1',
        name: 'Googly',
        src: 'asset/svg/expression/googly.svg',
    },
    {
        id: 2,
        buttonId: 'button2',
        name: 'Heart',
        src: 'asset/svg/expression/heart.svg',
    },
    {
        id: 3,
        buttonId: 'button3',
        name: 'Smile',
        src: 'asset/svg/expression/smile.svg',
    },
    {
        id: 4,
        buttonId: 'button4',
        name: 'Angry',
        src: null, // Placeholder - add icon later
    },
    {
        id: 5,
        buttonId: 'button5',
        name: 'Sad',
        src: null, // Placeholder - add icon later
    },
    {
        id: 6,
        buttonId: 'button6',
        name: 'Arrow',
        src: null, // Placeholder - add icon later
    },
    {
        id: 7,
        buttonId: 'button7',
        name: 'O Eye',
        src: null, // Placeholder - add icon later
    },
    {
        id: 8,
        buttonId: 'button8',
        name: 'Cry',
        src: null, // Placeholder - add icon later
    },
    {
        id: 9,
        buttonId: 'button9',
        name: 'Doubted',
        src: null, // Placeholder - add icon later
    },
    {
        id: 10,
        buttonId: 'button10',
        name: 'Rounded',
        src: null, // Placeholder - add icon later
    },
    {
        id: 11,
        buttonId: 'button11',
        name: 'Sharp',
        src: null, // Placeholder - add icon later
    },
    {
        id: 12,
        buttonId: 'button12',
        name: 'Giggle',
        src: null, // Placeholder - add icon later
    },
    {
        id: 13,
        buttonId: 'button13',
        name: 'Unimpressed',
        src: null, // Placeholder - add icon later
    },
]
document.getElementById('expBtnCount').textContent = expression.length;

// Create expression buttons
const expBtn = document.getElementById('exp-btn');
expression.forEach(exp => {
    const button = document.createElement('button');
    button.id = exp.buttonId;
    button.className = 'exp-btn';
    button.onclick = () => toggleButton(exp.buttonId);

    // Add placeholder class and text if no icon is available
    if (!exp.src) {
        button.classList.add('placeholder');
        button.title = exp.name;

        // Create text element for placeholder
        const textSpan = document.createElement('span');
        textSpan.className = 'placeholder-text';
        textSpan.textContent = exp.name;
        button.appendChild(textSpan);
    } else {
        const img = document.createElement('img');
        img.src = exp.src;
        img.alt = exp.name;
        button.appendChild(img);
    }

    expBtn.appendChild(button);
});

// Toggle button state
let activeButton = null;
async function toggleButton(btnId) {
    const button = document.getElementById(btnId);
    if (activeButton !== null && activeButton !== button) {
        activeButton.classList.remove('active');
    }
    button.classList.add('active');
    activeButton = button;
    let selected = expression.find(({ buttonId }) => buttonId === btnId);
    setEyeStateCharacteristic(selected.id);
    setCurrentExpression(selected);
}

function setExpression(i) {
    let button = expression.find(({ id }) => id === i);
    if (!button) {
        toggleButton(expression[0].buttonId)
    } else {
        toggleButton(button.buttonId)
    }
}

let currentExp = 0;
function setCurrentExpression(btn) {
    // Update the dual status display for eye
    const currentEyeState = document.getElementById('currentEyeState');
    if (currentEyeState) {
        currentEyeState.textContent = btn.name;
    }

    // Provide haptic feedback
    vibrateDevice();
}

//* --------- Control Mode Switching ---------
let currentControlMode = 'eye'; // 'eye' or 'mouth'

function switchControlMode(mode) {
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
}

//* --------- Mouth State ---------
const mouthStateNames = ['IDLE', 'WAH', 'EH', 'POUT', 'DROOL'];

function setMouthState(state) {
    // Update BLE characteristic
    setMouthStateCharacteristic(state);

    // Update UI - remove active class from all buttons
    const buttons = document.querySelectorAll('.mouth-state-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Add active class to selected button
    const activeButton = document.querySelector(`.mouth-state-btn[data-state="${state}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Update current state display in dual status
    const currentMouthState = document.getElementById('currentMouthState');
    if (currentMouthState && state >= 0 && state < mouthStateNames.length) {
        currentMouthState.textContent = mouthStateNames[state];
    }

    // Provide haptic feedback
    vibrateDevice();
}

//* --------- Viseme ---------
const visemeBtn = document.getElementById('visemeBtn');
const visemeOn = document.getElementById('visemeOn');
const visemeOff = document.getElementById('visemeOff');
const visemeSilder = document.getElementById('vsmSlider');
function toggleViseme() {
    visemeBtn.classList.toggle('active');
    visemeOn.classList.toggle('active');
    visemeOff.classList.toggle('active');
    visemeSilder.classList.toggle('disable');
    vibrateDevice();
    updateViseme();
}

function setViseme(i) {
    if (i && !isVisemeOn()) {
        toggleViseme();
    } else if (!i && isVisemeOn()) {
        toggleViseme();
    }
}

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
function createHornDots(numDots) {
    const dotsContainer = document.getElementById('horn-dots-container');
    for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dotsContainer.appendChild(dot);
    }
}

function renderTotalHornDots() {
    const deviceWidth = window.innerWidth;
    const numDots = Math.floor(deviceWidth / 30);
    const dotsContainer = document.getElementById('horn-dots-container');
    dotsContainer.innerHTML = '';
    createHornDots(numDots);
}
renderTotalHornDots();

let hornLedValueInput = document.getElementById('hornLedValue');
function setHornLedBrightnessValue(i) {
    hornLedValueInput.value = i;
    renderHornWhiteDots(hornLedValueInput.value);
}

hornLedValueInput.addEventListener('input', () => {
    let value = hornLedValueInput.value;
    renderHornWhiteDots(value);
    throttledAndDebouncedSetHornLedBrightness(value);
});

let prevNumOfHornWhiteDots = 0;
function renderHornWhiteDots(value, firstTime) {
    const dotsContainer = document.getElementById('horn-dots-container');
    let dots = dotsContainer.querySelectorAll('.dot');
    const numOfWhiteDots = Math.ceil((value / 100) * dots.length);
    if ((numOfWhiteDots !== prevNumOfHornWhiteDots) && !firstTime) {
        vibrateDevice();
        prevNumOfHornWhiteDots = numOfWhiteDots;
    }
    dots.forEach((dot, index) => {
        if (index < numOfWhiteDots) {
            dot.classList.add('white-dot');
        } else {
            dot.classList.remove('white-dot');
        }
    });
    const sliderValueElement = document.getElementById('hornLedSliderValue');
    sliderValueElement.textContent = value;
}

//* --------- Cheek Panel Brightness ---------
function createCheekDots(numDots) {
    const dotsContainer = document.getElementById('cheek-dots-container');
    for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dotsContainer.appendChild(dot);
    }
}

function renderTotalCheekDots() {
    const deviceWidth = window.innerWidth;
    const numDots = Math.floor(deviceWidth / 30);
    const dotsContainer = document.getElementById('cheek-dots-container');
    dotsContainer.innerHTML = '';
    createCheekDots(numDots);
}
renderTotalCheekDots();

let cheekPanelValueInput = document.getElementById('cheekPanelValue');
function setCheekPanelBrightnessValue(i) {
    cheekPanelValueInput.value = i;
    renderCheekWhiteDots(cheekPanelValueInput.value);
}

cheekPanelValueInput.addEventListener('input', () => {
    let value = cheekPanelValueInput.value;
    renderCheekWhiteDots(value);
    throttledAndDebouncedSetCheekPanelBrightness(value);
});

let prevNumOfCheekWhiteDots = 0;
function renderCheekWhiteDots(value, firstTime) {
    const dotsContainer = document.getElementById('cheek-dots-container');
    let dots = dotsContainer.querySelectorAll('.dot');
    const numOfWhiteDots = Math.ceil((value / 255) * dots.length);
    if ((numOfWhiteDots !== prevNumOfCheekWhiteDots) && !firstTime) {
        vibrateDevice();
        prevNumOfCheekWhiteDots = numOfWhiteDots;
    }
    dots.forEach((dot, index) => {
        if (index < numOfWhiteDots) {
            dot.classList.add('white-dot');
        } else {
            dot.classList.remove('white-dot');
        }
    });
    const sliderValueElement = document.getElementById('cheekPanelSliderValue');
    // Convert 0-255 to 0-100 percentage
    const percentageValue = Math.round((value / 255) * 100);
    sliderValueElement.textContent = percentageValue;
}

//* --------- Consolidated Resize Handler ---------
// Update all dots when the window is resized
window.addEventListener('resize', () => {
    // Matrix brightness - Disabled
    // renderTotalDots();
    // renderWhiteDots(dotValueInput.value);

    // Horn LED brightness
    renderTotalHornDots();
    renderHornWhiteDots(hornLedValueInput.value);

    // Cheek Panel brightness
    renderTotalCheekDots();
    renderCheekWhiteDots(cheekPanelValueInput.value);
});

//* --------- Cheek Panel Color Controls ---------
const bgColorPicker = document.getElementById('bgColorPicker');
const fadeColorPicker = document.getElementById('fadeColorPicker');
const bgColorHex = document.getElementById('bgColorHex');
const fadeColorHex = document.getElementById('fadeColorHex');

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Helper function to convert RGB to hex
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

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
function setCheekBgColorValue(r, g, b) {
    const hex = rgbToHex(r, g, b);
    if (bgColorPicker) bgColorPicker.value = hex;
    if (bgColorHex) bgColorHex.textContent = hex;
}

function setCheekFadeColorValue(r, g, b) {
    const hex = rgbToHex(r, g, b);
    if (fadeColorPicker) fadeColorPicker.value = hex;
    if (fadeColorHex) fadeColorHex.textContent = hex;
}

// Reset colors to default values
function resetCheekColors() {
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
}

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

// Display mode names for reference
const displayModeNames = ['Gradient', 'Spiral Vortex', 'Plasma Effect', 'Radial Pulse', 'Dual Spiral', 'Dual Circle'];

// Set display color mode (called when connecting to device or changing mode)
function setDisplayColorMode(mode) {
    // Update BLE characteristic
    setDisplayColorModeCharacteristic(mode);

    // Update UI - toggle button states
    const modeButtons = [
        displayColorModeGradient,
        displayColorModeSpiral,
        displayColorModePlasma,
        displayColorModeRadial,
        displayColorModeDualSpiral,
        displayColorModeDualCircle
    ];

    // Remove active class from all mode buttons
    modeButtons.forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    // Add active class to selected mode button
    if (mode >= 0 && mode < modeButtons.length && modeButtons[mode]) {
        modeButtons[mode].classList.add('active');
    }

    // Show/hide color controls based on mode
    // Mode 0: Gradient - shows Color1 (top) and Color2 (bottom)
    // Mode 1-3: Rainbow effects - no color controls
    // Mode 4: Dual Spiral - shows Color1 only, Option1 (Thickness), Option2 (Speed)
    // Mode 5: Dual Circle - shows Color1 only, Option1 (Thickness), Option2 (Speed)
    const showColorControls = (mode === 0 || mode === 4 || mode === 5);
    if (customGradientColors) {
        customGradientColors.style.display = showColorControls ? 'block' : 'none';
    }

    // Show/hide second color picker (Color2) - for modes 0, 4, and 5
    if (gradientBottomColorContainer) {
        gradientBottomColorContainer.style.display = (mode === 0 || mode === 4 || mode === 5) ? 'block' : 'none';
    }

    // Show/hide gradient preview - only for mode 0 (Gradient)
    if (gradientPreviewContainer) {
        gradientPreviewContainer.style.display = (mode === 0) ? 'block' : 'none';
    }

    // Show/hide thickness control (Option1) - for modes 4 and 5
    if (dualSpiralThicknessControl) {
        dualSpiralThicknessControl.style.display = (mode === 4 || mode === 5) ? 'block' : 'none';
    }

    // Show/hide speed control (Option2) - for modes 4 and 5
    if (dualCircleThicknessControl) {
        dualCircleThicknessControl.style.display = (mode === 4 || mode === 5) ? 'block' : 'none';
    }

    // Show/hide direction control (Option3) - for modes 4 and 5
    if (directionInvertControl) {
        directionInvertControl.style.display = (mode === 4 || mode === 5) ? 'block' : 'none';
    }

    // Update color picker labels based on mode
    if (mode === 0) {
        if (gradientTopColorLabel) gradientTopColorLabel.textContent = 'Top Gradient Color';
        if (gradientBottomColorLabel) gradientBottomColorLabel.textContent = 'Bottom Gradient Color';
    } else if (mode === 4) {
        if (gradientTopColorLabel) gradientTopColorLabel.textContent = 'Primary Spiral Color';
        if (gradientBottomColorLabel) gradientBottomColorLabel.textContent = 'Secondary Spiral Color';
    } else if (mode === 5) {
        if (gradientTopColorLabel) gradientTopColorLabel.textContent = 'Primary Circle Color';
        if (gradientBottomColorLabel) gradientBottomColorLabel.textContent = 'Secondary Circle Color';
    }

    // Update option control labels based on mode
    updateEffectOptionLabels(mode);

    // Update preview when mode changes (only for Gradient mode)
    if (mode === 0) {
        updateGradientPreview(gradientTopColorPicker.value, gradientBottomColorPicker.value, mode);
    }

    // Provide haptic feedback
    vibrateDevice();
}

// Set color mode value from BLE (called when connecting to device)
function setDisplayColorModeValue(mode) {
    // Update UI - toggle button states
    const modeButtons = [
        displayColorModeGradient,
        displayColorModeSpiral,
        displayColorModePlasma,
        displayColorModeRadial,
        displayColorModeDualSpiral,
        displayColorModeDualCircle
    ];

    // Remove active class from all mode buttons
    modeButtons.forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    // Add active class to selected mode button
    if (mode >= 0 && mode < modeButtons.length && modeButtons[mode]) {
        modeButtons[mode].classList.add('active');
    }

    // Show/hide color controls based on mode
    const showColorControls = (mode === 0 || mode === 4 || mode === 5);
    if (customGradientColors) {
        customGradientColors.style.display = showColorControls ? 'block' : 'none';
    }

    // Show/hide second color picker (Color2) - for modes 0, 4, and 5
    if (gradientBottomColorContainer) {
        gradientBottomColorContainer.style.display = (mode === 0 || mode === 4 || mode === 5) ? 'block' : 'none';
    }

    // Show/hide gradient preview - only for mode 0 (Gradient)
    if (gradientPreviewContainer) {
        gradientPreviewContainer.style.display = (mode === 0) ? 'block' : 'none';
    }

    // Show/hide thickness control (Option1) - for modes 4 and 5
    if (dualSpiralThicknessControl) {
        dualSpiralThicknessControl.style.display = (mode === 4 || mode === 5) ? 'block' : 'none';
    }

    // Show/hide speed control (Option2) - for modes 4 and 5
    if (dualCircleThicknessControl) {
        dualCircleThicknessControl.style.display = (mode === 4 || mode === 5) ? 'block' : 'none';
    }

    // Show/hide direction control (Option3) - for modes 4 and 5
    if (directionInvertControl) {
        directionInvertControl.style.display = (mode === 4 || mode === 5) ? 'block' : 'none';
    }

    // Update color picker labels based on mode
    if (mode === 0) {
        if (gradientTopColorLabel) gradientTopColorLabel.textContent = 'Top Gradient Color';
        if (gradientBottomColorLabel) gradientBottomColorLabel.textContent = 'Bottom Gradient Color';
    } else if (mode === 4) {
        if (gradientTopColorLabel) gradientTopColorLabel.textContent = 'Primary Spiral Color';
        if (gradientBottomColorLabel) gradientBottomColorLabel.textContent = 'Secondary Spiral Color';
    } else if (mode === 5) {
        if (gradientTopColorLabel) gradientTopColorLabel.textContent = 'Primary Circle Color';
        if (gradientBottomColorLabel) gradientBottomColorLabel.textContent = 'Secondary Circle Color';
    }

    // Update option control labels based on mode
    updateEffectOptionLabels(mode);

    // Update preview when mode changes (only for Gradient mode)
    if (mode === 0) {
        updateGradientPreview(gradientTopColorPicker.value, gradientBottomColorPicker.value, mode);
    }
}

// Update gradient preview
function updateGradientPreview(topColor, bottomColor, mode = null) {
    if (gradientPreview) {
        // If mode is not provided, try to get current active mode
        if (mode === null) {
            const modeButtons = [
                displayColorModeGradient,
                displayColorModeSpiral,
                displayColorModePlasma,
                displayColorModeRadial,
                displayColorModeDualSpiral,
                displayColorModeDualCircle
            ];
            mode = modeButtons.findIndex(btn => btn && btn.classList.contains('active'));
        }

        // DualSpiral mode (mode 4) - show dual spiral preview
        if (mode === 4) {
            gradientPreview.style.background = `conic-gradient(from 45deg, ${topColor} 0deg 45deg, ${bottomColor} 45deg 90deg, ${topColor} 90deg 135deg, ${bottomColor} 135deg 180deg, ${topColor} 180deg 225deg, ${bottomColor} 225deg 270deg, ${topColor} 270deg 315deg, ${bottomColor} 315deg 360deg)`;
            if (gradientPreviewTitle) {
                gradientPreviewTitle.textContent = 'DualSpiral Preview';
            }
        } else {
            // Default gradient preview for mode 0
            gradientPreview.style.background = `linear-gradient(to bottom, ${topColor}, ${bottomColor})`;
            if (gradientPreviewTitle) {
                gradientPreviewTitle.textContent = 'Preview';
            }
        }
    }
}

// Update effect option labels based on mode
function updateEffectOptionLabels(mode) {
    const option1Label = document.getElementById('effectOption1Label');
    const option2Label = document.getElementById('effectOption2Label');

    // For modes 4 and 5, both use Thickness and Speed
    if (mode === 4 || mode === 5) {
        if (option1Label) option1Label.textContent = 'Thickness';
        if (option2Label) option2Label.textContent = 'Speed';
    }
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
function setDisplayEffectColor1Value(r, g, b) {
    const hex = rgbToHex(r, g, b);
    gradientTopColorPicker.value = hex;
    gradientTopColorHex.textContent = hex;
    updateGradientPreview(hex, gradientBottomColorPicker.value);
}

function setDisplayEffectColor2Value(r, g, b) {
    const hex = rgbToHex(r, g, b);
    gradientBottomColorPicker.value = hex;
    gradientBottomColorHex.textContent = hex;
    updateGradientPreview(gradientTopColorPicker.value, hex);
}

// Reset display colors to default values
function resetDisplayColors() {
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
}

//* --------- Display Effect Option Controls ---------
// Set Display Effect Option 1 value from BLE (called when connecting to device)
// Option1 is used for Thickness in modes 4 (Dual Spiral) and 5 (Dual Circle)
function setDisplayEffectOption1Value(value) {
    if (dualSpiralThicknessSlider) {
        dualSpiralThicknessSlider.value = value;
        updateDisplayEffectOption1Slider(value);
    }
}

// Update slider display for Effect Option 1 (Thickness)
function updateDisplayEffectOption1Slider(value) {
    const valueDisplay = document.getElementById('spiralThicknessValue');
    if (valueDisplay) {
        valueDisplay.textContent = value;
    }

    // Update slider fill
    if (dualSpiralThicknessSlider) {
        const min = parseInt(dualSpiralThicknessSlider.min) || 0;
        const max = parseInt(dualSpiralThicknessSlider.max) || 255;
        const percentage = ((value - min) / (max - min)) * 100;
        dualSpiralThicknessSlider.style.background = `linear-gradient(to right, white 0%, white ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
    }
}

// Effect Option 1 (Thickness) slider event listener
if (dualSpiralThicknessSlider) {
    dualSpiralThicknessSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        updateDisplayEffectOption1Slider(value);
        throttledAndDebouncedSetDisplayEffectOption1(value);
        vibrateDevice();
    });
}

// Set Display Effect Option 2 value from BLE (called when connecting to device)
// Option2 is used for Speed in modes 4 (Dual Spiral) and 5 (Dual Circle)
function setDisplayEffectOption2Value(value) {
    if (dualCircleThicknessSlider) {
        dualCircleThicknessSlider.value = value;
        updateDisplayEffectOption2Slider(value);
    }
}

// Update slider display for Effect Option 2 (Speed)
function updateDisplayEffectOption2Slider(value) {
    const valueDisplay = document.getElementById('circleThicknessValue');
    if (valueDisplay) {
        valueDisplay.textContent = value;
    }

    // Update slider fill
    if (dualCircleThicknessSlider) {
        const min = parseInt(dualCircleThicknessSlider.min) || 0;
        const max = parseInt(dualCircleThicknessSlider.max) || 255;
        const percentage = ((value - min) / (max - min)) * 100;
        dualCircleThicknessSlider.style.background = `linear-gradient(to right, white 0%, white ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
    }
}

// Effect Option 2 (Speed) slider event listener
if (dualCircleThicknessSlider) {
    dualCircleThicknessSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        updateDisplayEffectOption2Slider(value);
        throttledAndDebouncedSetDisplayEffectOption2(value);
        vibrateDevice();
    });
}

// Effect Option 3 (Direction/Invert) toggle function
function toggleDirectionInvert() {
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
}

// Set Display Effect Option 3 value from BLE (called when connecting to device)
// Option3 is used for Direction/Invert in modes 4 (Dual Spiral) and 5 (Dual Circle)
function setDisplayEffectOption3Value(value) {
    const checkbox = document.getElementById('directionInvertToggle');
    if (checkbox && directionInvertText) {
        checkbox.checked = (value === 1);
        directionInvertText.textContent = (value === 1) ? 'Inverted' : 'Normal';
    }
}
