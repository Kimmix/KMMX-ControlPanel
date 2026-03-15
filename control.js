
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
        name: 'Boop',
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
        name: 'Sleep',
        src: null, // Placeholder - add icon later
    },
    {
        id: 9,
        buttonId: 'button9',
        name: 'Cry',
        src: null, // Placeholder - add icon later
    },
    {
        id: 10,
        buttonId: 'button10',
        name: 'Doubted',
        src: null, // Placeholder - add icon later
    },
    {
        id: 11,
        buttonId: 'button11',
        name: 'Rounded',
        src: null, // Placeholder - add icon later
    },
    {
        id: 12,
        buttonId: 'button12',
        name: 'Sharp',
        src: null, // Placeholder - add icon later
    },
    {
        id: 13,
        buttonId: 'button13',
        name: 'Giggle',
        src: null, // Placeholder - add icon later
    },
    {
        id: 14,
        buttonId: 'button14',
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
    if (activeButton !== null) {
        activeButton.classList.remove('active');
    }
    if (activeButton !== button) {
        button.classList.add('active');
        activeButton = button;
        let selected = expression.find(({ buttonId }) => buttonId === btnId);
        setEyeStateCharacteristic(selected.id);
        setCurrentExpression(selected);
    } else {
        activeButton = null;
    }
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
    // Grid layout doesn't need current expression preview
    // Just provide haptic feedback
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
bgColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    bgColorHex.textContent = color.toUpperCase();
    const rgb = hexToRgb(color);
    if (rgb) {
        throttledAndDebouncedSetCheekBgColor(rgb.r, rgb.g, rgb.b);
        vibrateDevice();
    }
});

// Fade color picker handler
fadeColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    fadeColorHex.textContent = color.toUpperCase();
    const rgb = hexToRgb(color);
    if (rgb) {
        throttledAndDebouncedSetCheekFadeColor(rgb.r, rgb.g, rgb.b);
        vibrateDevice();
    }
});

// Color preset buttons handler
document.querySelectorAll('.color-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color');
        const target = btn.getAttribute('data-target');

        if (target === 'bg') {
            bgColorPicker.value = color;
            bgColorHex.textContent = color.toUpperCase();
            const rgb = hexToRgb(color);
            if (rgb) {
                throttledAndDebouncedSetCheekBgColor(rgb.r, rgb.g, rgb.b);
            }
        } else if (target === 'fade') {
            fadeColorPicker.value = color;
            fadeColorHex.textContent = color.toUpperCase();
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
    bgColorPicker.value = hex;
    bgColorHex.textContent = hex;
}

function setCheekFadeColorValue(r, g, b) {
    const hex = rgbToHex(r, g, b);
    fadeColorPicker.value = hex;
    fadeColorHex.textContent = hex;
}

// Reset colors to default values
function resetCheekColors() {
    const defaultBgColor = '#FF446C';  // Default pink
    const defaultFadeColor = '#F9826C';  // Default coral

    // Update background color
    bgColorPicker.value = defaultBgColor;
    bgColorHex.textContent = defaultBgColor;
    const bgRgb = hexToRgb(defaultBgColor);
    if (bgRgb) {
        throttledAndDebouncedSetCheekBgColor(bgRgb.r, bgRgb.g, bgRgb.b);
    }

    // Update fade color
    fadeColorPicker.value = defaultFadeColor;
    fadeColorHex.textContent = defaultFadeColor;
    const fadeRgb = hexToRgb(defaultFadeColor);
    if (fadeRgb) {
        throttledAndDebouncedSetCheekFadeColor(fadeRgb.r, fadeRgb.g, fadeRgb.b);
    }

    // Haptic feedback
    vibrateDevice();
}
