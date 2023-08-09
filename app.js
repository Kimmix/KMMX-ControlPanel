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
        startBLE();
    });
});

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
    splash.style.display = 'none';
    mainContent.style.display = 'flex';
}

const statusElement = document.getElementById("status");
function isStatusConnected(bool) {
    if (bool) {
        timerInterval = setInterval(() => {
            timerValue++;
            updateStatusAndTimer();
        }, 1000);
        showControlPanel();
        statusElement.textContent = "Connected";
    } else {
        clearInterval(timerInterval);
        statusElement.textContent = "Disconnected";
        document.getElementById("timer").textContent = "0:00";
        timerValue = 0;
    }
}
