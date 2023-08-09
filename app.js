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

function updateStatusAndTimer() {
    const timerElement = document.getElementById("timer");
    const minutes = Math.floor(timerValue / 60);
    const seconds = timerValue % 60;
    const formattedTimer = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    timerElement.textContent = formattedTimer;
}

timerInterval = setInterval(() => {
    timerValue++;
    updateStatusAndTimer();
}, 1000);

// Show main page
document.addEventListener('DOMContentLoaded', function () {
    const splash = document.getElementById('splash');
    const mainContent = document.getElementById('mainContent');

    splash.addEventListener('click', function () {
        splash.style.display = 'none';
        mainContent.style.display = 'flex';
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
    } else {
        activeButton = null;
    }
}