//! Show main page
document.addEventListener('DOMContentLoaded', async function () {
    const splash = document.getElementById('splash');
    const progressContainer = document.getElementById('progressContainer');

    // Show splash screen and wait for user to tap to connect
    splash.addEventListener('click', async function () {
        // Show progress bar and status text
        if (progressContainer) {
            progressContainer.classList.add('active');
        }

        // Vibrate on tap
        vibrateDevice();

        // Show pairing UI
        await startBLEWithProgress();
    });
});

//? Start BLE with progress feedback
async function startBLEWithProgress() {
    const loaderProgress = document.getElementById('loaderProgress');

    try {
        // Show status text
        if (loaderProgress) {
            loaderProgress.classList.add('active');
        }

        await startBLE();

    } catch (error) {
        console.error('BLE connection failed:', error);
        updateProgress(0, 'Failed');

        // Reset UI after error
        setTimeout(() => {
            const progressContainer = document.getElementById('progressContainer');
            const loaderProgress = document.getElementById('loaderProgress');

            if (progressContainer) {
                progressContainer.classList.remove('active');
            }
            if (loaderProgress) {
                loaderProgress.classList.remove('active');
                loaderProgress.textContent = '';
            }
            updateProgress(0);
        }, 2000);
    }
}

//? Update progress bar and loader text
function updateProgress(percent, text) {
    const progressBar = document.getElementById('progressBar');
    const loaderProgress = document.getElementById('loaderProgress');

    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    if (loaderProgress && text) {
        loaderProgress.textContent = text;
    }
}

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
        // Clear device info
        updateDeviceInfo(null);
        // Disable BLE refresh button
        const refreshBleBtn = document.getElementById('refreshBleBtn');
        if (refreshBleBtn) {
            refreshBleBtn.disabled = true;
        }
    }
}

//? Store full device ID for toggling
let fullDeviceId = null;
let isShowingFullId = false;

//? Update device information
function updateDeviceInfo(device) {
    const deviceNameStat = document.getElementById('device-name-stat');
    const bleProtocolStat = document.getElementById('ble-protocol-stat');
    const deviceIdItem = document.getElementById('device-id-item');

    if (device) {
        // Update device name
        if (deviceNameStat) {
            deviceNameStat.textContent = device.name || 'KMMX-BLE';
        }

        // Update device ID (show last 6 characters of device ID)
        if (bleProtocolStat && device.id) {
            fullDeviceId = device.id;
            const shortId = device.id.length > 6 ? device.id.slice(-6) : device.id;
            bleProtocolStat.textContent = shortId.toUpperCase();
            isShowingFullId = false;

            // Make the entire item clickable
            if (deviceIdItem) {
                deviceIdItem.style.cursor = 'pointer';
                deviceIdItem.onclick = toggleDeviceId;
            }
        } else if (bleProtocolStat) {
            bleProtocolStat.textContent = '-';
            fullDeviceId = null;
        }
    } else {
        // Clear device info when disconnected
        if (deviceNameStat) {
            deviceNameStat.textContent = '-';
        }
        if (bleProtocolStat) {
            bleProtocolStat.textContent = '-';
        }
        if (deviceIdItem) {
            deviceIdItem.style.cursor = 'default';
            deviceIdItem.onclick = null;
        }
        fullDeviceId = null;
        isShowingFullId = false;
    }
}

//? Toggle between short and full device ID
function toggleDeviceId() {
    const bleProtocolStat = document.getElementById('ble-protocol-stat');

    if (!fullDeviceId || !bleProtocolStat) return;

    vibrateDevice();

    if (isShowingFullId) {
        // Show short ID (last 6 characters)
        const shortId = fullDeviceId.length > 6 ? fullDeviceId.slice(-6) : fullDeviceId;
        bleProtocolStat.textContent = shortId.toUpperCase();
        bleProtocolStat.style.fontSize = '1.1rem';
        bleProtocolStat.style.wordBreak = 'normal';
        isShowingFullId = false;
    } else {
        // Show full ID (smaller font to fit screen)
        bleProtocolStat.textContent = fullDeviceId.toUpperCase();
        bleProtocolStat.style.fontSize = '0.95rem';
        bleProtocolStat.style.wordBreak = 'break-all';
        isShowingFullId = true;
    }
}

//? Update timer in stats
function updateStatusAndTimer() {
    if (timerElement) {
        const minutes = Math.floor(timerValue / 60);
        const seconds = timerValue % 60;
        const formattedTimer = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        timerElement.textContent = formattedTimer;
    }
}

//? Show control panel
function showControlPanel() {
    // document.documentElement.requestFullscreen();
    splash.style.display = 'none';
    mainContent.style.display = 'flex';
}

//? Disconnect Popup
function showDisconnectPopup() {
    const popup = document.getElementById('disconnectPopup');
    if (popup) {
        popup.classList.add('show');
        vibrateDevice();
    }
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

//* ------- BLE Characteristics Toggle ---------
function toggleBLECharacteristics() {
    const bleCharContent = document.getElementById('bleCharContent');
    const bleCharBtn = document.getElementById('bleCharBtn');

    if (bleCharContent.style.display === 'none') {
        // Show BLE characteristics
        bleCharContent.style.display = 'block';
        bleCharBtn.classList.add('expanded');

        // Scroll to bottom after a short delay to allow rendering
        setTimeout(() => {
            bleCharContent.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    } else {
        // Hide BLE characteristics
        bleCharContent.style.display = 'none';
        bleCharBtn.classList.remove('expanded');
    }

    // Vibrate on toggle
    vibrateDevice();
}

//* ------- Debug Info ---------
function toggleDebugInfo() {
    const debugInfo = document.getElementById('debugInfo');
    const debugBtn = document.getElementById('debugBtn');

    if (debugInfo.style.display === 'none') {
        // Show debug info and populate it
        debugInfo.style.display = 'block';
        debugBtn.classList.add('expanded');
        populateDebugInfo();

        // Scroll to bottom after a short delay to allow rendering
        setTimeout(() => {
            debugInfo.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    } else {
        // Hide debug info
        debugInfo.style.display = 'none';
        debugBtn.classList.remove('expanded');
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
