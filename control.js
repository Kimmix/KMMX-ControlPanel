
//* --------- Expression ---------
const expression = [
    {
        id: 0,
        buttonId: "button1",
        src: "asset/svg/expression/default.svg",
    },
    {
        id: 1,
        buttonId: "button2",
        src: "asset/svg/expression/googly.svg",
    },
    {
        id: 2,
        buttonId: "button3",
        src: "asset/svg/expression/heart.svg",
    },
    {
        id: 3,
        buttonId: "button4",
        src: "asset/svg/expression/googly.svg",
    },
    {
        id: 4,
        buttonId: "button5",
        src: "asset/svg/expression/default.svg",
    },
]
document.getElementById("expBtnCount").textContent = expression.length;

// Create sub button
const expBtn = document.getElementById('exp-btn');
expression.forEach(exp => {
    const button = document.createElement('button');
    button.id = exp.buttonId;
    button.className = 'exp-btn';
    button.onclick = () => toggleButton(exp.buttonId);

    const img = document.createElement('img');
    img.src = exp.src;
    img.alt = 'Expression';

    button.appendChild(img);
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
    document.getElementById("current-exp").src = btn.src;
    vibrateDevice();
}

//* --------- Viseme ---------
const visemeBtn = document.getElementById('visemeBtn');
const visemeOn = document.getElementById('visemeOn');
const visemeOff = document.getElementById('visemeOff');
function toggleViseme() {
    visemeBtn.classList.toggle('active');
    visemeOn.classList.toggle('active');
    visemeOff.classList.toggle('active');
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
let vismeInput = document.getElementById('vsmValue');
vismeInput.addEventListener('input', () => {
    const sliderNumbers = document.querySelectorAll(".sliderNumber");
    const rangeInput = document.getElementById("vsmValue");

    rangeInput.addEventListener("input", () => {
        const inputValue = parseInt(rangeInput.value, 10);

        sliderNumbers.forEach((number, index) => {
            if (index + 1 === inputValue) {
                number.classList.add("active");
            } else {
                number.classList.remove("active");
            }
        });
    });
});

function isVisemeOn() {
    return visemeBtn.classList.contains('active')
}

//* --------- Matrix Brightness ---------
function createDots(numDots) {
    const dotsContainer = document.getElementById('dots-container');
    for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dotsContainer.appendChild(dot);
    }
}

function renderTotalDots() {
    const deviceWidth = window.innerWidth;
    const numDots = Math.floor(deviceWidth / 30); // Adjust as needed
    const dotsContainer = document.getElementById('dots-container');
    dotsContainer.innerHTML = ''; // Clear previous dots
    createDots(numDots);
}
renderTotalDots(); // On page load

let dotValueInput = document.getElementById('dotValue');
// function setBrightnessvalue(i) {
//     dotValueInput.value = i;
//     renderWhiteDots(dotValueInput.value);
// }
// Update dots when the window is resized
window.addEventListener('resize', () => {
    renderTotalDots();
    renderWhiteDots(dotValueInput.value);
});

dotValueInput.addEventListener('input', () => {
    let value = dotValueInput.value
    renderWhiteDots(value);
    throttledAndDebouncedSetDisplayBrightness(value);
});

let prevNumOfWhiteDots = 0;
function renderWhiteDots(value, firstTime) {
    let dots = document.querySelectorAll('.dot');
    const numOfWhiteDots = Math.ceil((value / 100) * dots.length);
    if ((numOfWhiteDots !== prevNumOfWhiteDots) && !firstTime) {
        vibrateDevice();
        prevNumOfWhiteDots = numOfWhiteDots;
    }
    dots.forEach((dot, index) => {
        if (index < numOfWhiteDots) {
            dot.classList.add('white-dot');
        } else {
            dot.classList.remove('white-dot');
        }
    });
    const sliderValueElement = document.getElementById('sliderValue');
    sliderValueElement.textContent = value;
}
