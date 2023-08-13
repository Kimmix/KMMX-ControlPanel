// Check BLE compatibility
try {
    navigator.bluetooth.getAvailability()
} catch (error) {
    console.error('This browser does not support BLE!');
}

// Fading FavIcon
const favicon = document.querySelector('link[rel="icon"]')
document.addEventListener("visibilitychange", () => {
    const hidden = document.hidden
    favicon.setAttribute("href", `/favicon${hidden ? "-hidden" : ""}.png`)
})

// Timer
let isConnected = true;
let timerValue = 0;
let timerInterval;
const timerElement = document.getElementById("timer");
function updateStatusAndTimer() {
    const minutes = Math.floor(timerValue / 60);
    const seconds = timerValue % 60;
    const formattedTimer = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    timerElement.textContent = formattedTimer;
}

// Show main page
document.addEventListener('DOMContentLoaded', function () {
    const splash = document.getElementById('splash');
    splash.addEventListener('click', function () {
        // startBLE();
        showControlPanel();
    });
});

const statusElement = document.getElementById("status");
const pill = document.getElementById("s-pill");
function isStatusConnected(bool) {
    if (bool) {
        timerInterval = setInterval(() => {
            timerValue++;
            updateStatusAndTimer();
        }, 1000);
        showControlPanel();
        statusElement.textContent = "Connected";
        pill.classList.remove('inactive')
    } else {
        clearInterval(timerInterval);
        statusElement.textContent = "Disconnected";
        document.getElementById("timer").textContent = "0:00";
        pill.classList.add('inactive')
        timerValue = 0;
    }
}

function showControlPanel() {
    // document.documentElement.requestFullscreen();
    splash.style.display = 'none';
    mainContent.style.display = 'flex';
}

// ------- Gyroscope ---------
// Get the moving element
var element = document.getElementById("movingElement");
// Initialize variables to store gyroscope data
var xRotation = 0;
var yRotation = 0;
window.addEventListener("deviceorientation", handleOrientation);
// Function to handle device orientation changes
function handleOrientation(event) {
    xRotation = clamp((event.beta - 20) * 0.4, -70, 30); // x-axis rotation (tilt forward/backward)
    yRotation = clamp(event.gamma * 0.6, -100, 20); // y-axis rotation (tilt left/right)

    // Update element's position using CSS translate
    element.style.transform = "translate(" + yRotation + "px, " + xRotation + "px)";
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// ------- Expression ---------
// Count Expression button
var expBtnCount = document.getElementsByClassName("exp-btn").length;
document.getElementById("expBtnCount").textContent = expBtnCount;

// Toggle button state
let activeButton = null;
function toggleButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (activeButton !== null) {
        activeButton.classList.remove('active');
    }
    if (activeButton !== button) {
        button.classList.add('active');
        activeButton = button;
        onExpressionButtonClick(buttonId);
    } else {
        activeButton = null;
    }
}

const expression = [
    {
        buttonId: "button1",
        src: "asset/svg/expression/default.svg",
    },
    {
        buttonId: "button2",
        src: "asset/svg/expression/heart.svg",
    },
    {
        buttonId: "button3",
        src: "asset/svg/expression/googly.svg",
    },
    {
        buttonId: "button4",
        src: "asset/svg/expression/heart.svg",
    },
    {
        buttonId: "button5",
        src: "asset/svg/expression/default.svg",
    },

]

const container = document.getElementById('exp-btn');

expression.forEach(exp => {
    const button = document.createElement('button');
    button.id = exp.buttonId;
    button.className = 'exp-btn';
    button.onclick = () => toggleButton(exp.buttonId);

    const img = document.createElement('img');
    img.src = exp.src;
    img.alt = 'Expression';

    button.appendChild(img);
    container.appendChild(button);
});

let currentExp = 0;
function setCurrentExpression(setId) {
    const btn = expression.find(({ buttonId }) => buttonId === setId);
    document.getElementById("current-exp").src = btn.src;
    vibrateDevice();
}

// Viseme
const visemeBtn = document.getElementById('visemeBtn');
const visemeOn = document.getElementById('visemeOn');
const visemeOff = document.getElementById('visemeOff');
function toggleViseme() {
    visemeBtn.classList.toggle('active');
    visemeOn.classList.toggle('active');
    visemeOff.classList.toggle('active');
    vibrateDevice();
}

const dots = document.querySelectorAll('.dot');
const dotValueInput = document.getElementById('dotValue');
dotValueInput.addEventListener('input', () => {
    updateDots(dotValueInput.value);
});

function updateDots(value) {
    const numOfWhiteDots = Math.ceil((value / 100) * 16);
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

dotValueInput.addEventListener('input', () => {
    const value = dotValueInput.value;
    updateDots(value);
});

// On page load
updateDots(dotValueInput.value);


function vibrateDevice() {
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}