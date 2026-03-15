//! Show main page
document.addEventListener('DOMContentLoaded', function () {
    const splash = document.getElementById('splash');
    splash.addEventListener('click', async function () {
        await startBLE();
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
    if (timerElement) {
        const minutes = Math.floor(timerValue / 60);
        const seconds = timerValue % 60;
        const formattedTimer = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        timerElement.textContent = formattedTimer;
    }
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
        if (statusElement) {
            statusElement.textContent = "Connected";
        }
        if (pill) {
            pill.classList.remove('inactive');
        }
        // Enable BLE refresh button
        const refreshBleBtn = document.getElementById('refreshBleBtn');
        if (refreshBleBtn) {
            refreshBleBtn.disabled = false;
        }
    } else {
        clearInterval(timerInterval);
        if (statusElement) {
            statusElement.textContent = "Disconnected";
        }
        if (timerElement) {
            timerElement.textContent = "0:00";
        }
        if (pill) {
            pill.classList.add('inactive');
        }
        timerValue = 0;
        // Disable BLE refresh button
        const refreshBleBtn = document.getElementById('refreshBleBtn');
        if (refreshBleBtn) {
            refreshBleBtn.disabled = true;
        }
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

//* ------- Debug Info ---------
function toggleDebugInfo() {
    const debugInfo = document.getElementById('debugInfo');
    const debugBtn = document.getElementById('debugBtn');

    if (debugInfo.style.display === 'none') {
        // Show debug info and populate it
        debugInfo.style.display = 'block';
        debugBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; margin-right: 8px;">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Hide Debug Info
        `;
        populateDebugInfo();
    } else {
        // Hide debug info
        debugInfo.style.display = 'none';
        debugBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; margin-right: 8px;">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            Show Debug Info
        `;
    }

    // Vibrate on toggle
    vibrateDevice();
}

async function populateDebugInfo() {
    // User Agent
    document.getElementById('debug-ua').textContent = navigator.userAgent;

    // Platform
    document.getElementById('debug-platform').textContent = navigator.platform || 'Unknown';

    // Screen Size
    document.getElementById('debug-screen').textContent =
        `${screen.width} × ${screen.height} (${screen.colorDepth}bit)`;

    // Viewport
    document.getElementById('debug-viewport').textContent =
        `${window.innerWidth} × ${window.innerHeight}`;

    // BLE Support
    let bleStatus = 'Not supported';
    if (navigator.bluetooth) {
        try {
            const available = await navigator.bluetooth.getAvailability();
            bleStatus = available ? '✓ Available' : '✗ Not available';
        } catch (e) {
            bleStatus = '✓ Supported (availability unknown)';
        }
    }
    document.getElementById('debug-ble').textContent = bleStatus;

    // Vibration Support
    document.getElementById('debug-vibrate').textContent =
        navigator.vibrate ? '✓ Supported' : '✗ Not supported';

    // Orientation Support
    const orientationSupport = typeof DeviceOrientationEvent !== 'undefined';
    document.getElementById('debug-orientation').textContent =
        orientationSupport ? '✓ Supported' : '✗ Not supported';

    // Online Status
    document.getElementById('debug-online').textContent =
        navigator.onLine ? '✓ Online' : '✗ Offline';

    // Service Worker
    let swStatus = 'Not supported';
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            swStatus = registration ? '✓ Registered' : '✗ Not registered';
        } catch (e) {
            swStatus = '✓ Supported (not registered)';
        }
    }
    document.getElementById('debug-sw').textContent = swStatus;

    // Connection Type
    let connectionType = 'Unknown';
    if (navigator.connection || navigator.mozConnection || navigator.webkitConnection) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        connectionType = connection.effectiveType || connection.type || 'Unknown';
    }
    document.getElementById('debug-connection').textContent = connectionType;
}
