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


function showControlPanel() {
    // document.documentElement.requestFullscreen();
    splash.style.display = 'none';
    mainContent.style.display = 'flex';
}

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

// Viseme
const toggleViseme = document.getElementById('toggleViseme');
toggleViseme.addEventListener('click', () => {
    toggleViseme.classList.toggle('active');
});

// ------- Gyroscope ---------
// Get the moving element
var element = document.getElementById("movingElement");

// Initialize variables to store gyroscope data
var xRotation = 0;
var yRotation = 0;

// Request permission to access device orientation
if (typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
            if (permissionState === "granted") {
                window.addEventListener("deviceorientation", handleOrientation);
            }
        })
        .catch(console.error);
} else {
    // Fallback for devices without requestPermission support
    window.addEventListener("deviceorientation", handleOrientation);
}

// Function to handle device orientation changes
function handleOrientation(event) {
    xRotation = clamp(event.beta, -70, 30); // x-axis rotation (tilt forward/backward)
    yRotation = clamp(event.gamma, -100, 30); // y-axis rotation (tilt left/right)

    // Update element's position using CSS translate
    element.style.transform = "translate(" + yRotation + "px, " + xRotation + "px)";
}