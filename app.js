//! Show main page
document.addEventListener('DOMContentLoaded', function () {
    const splash = document.getElementById('splash');
    splash.addEventListener('click', function () {
        startBLE();
        // showControlPanel();
    });
});

//? Check BLE compatibility
try {
    navigator.bluetooth.getAvailability()
} catch (error) {
    console.error('This browser does not support BLE!');
}

//? Fading FavIcon
const favicon = document.querySelector('link[rel="icon"]')
document.addEventListener("visibilitychange", () => {
    const hidden = document.hidden
    favicon.setAttribute("href", `/favicon${hidden ? "-hidden" : ""}.png`)
})

//? Device vibrate
function vibrateDevice() {
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

//? Timer
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

//? Connection status 
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

//? Show control panel
function showControlPanel() {
    // document.documentElement.requestFullscreen();
    splash.style.display = 'none';
    mainContent.style.display = 'flex';
}

//* ------- Gyroscope ---------
// Get the moving element
var element = document.getElementById("movingElement");
// Initialize variables to store gyroscope data
var xRotation = 0;
var yRotation = 0;
window.addEventListener("deviceorientation", handleOrientation);
// Function to handle device orientation changes
function handleOrientation(event) {
    xRotation = clamp((event.beta - 90) * 0.4, -70, 30); // x-axis rotation (tilt forward/backward)
    yRotation = clamp(event.gamma * 0.6, -100, 20); // y-axis rotation (tilt left/right)

    // Update element's position using CSS translate
    element.style.transform = "translate(" + yRotation + "px, " + xRotation + "px)";
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
