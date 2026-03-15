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
    const statusHeader = document.querySelector('.status-header');
    const staticHeader = document.querySelector('.static-header');

    splash.style.display = 'none';
    mainContent.style.display = 'flex';

    // Show headers with animation
    if (statusHeader) {
        statusHeader.style.display = 'block';
    }
    if (staticHeader) {
        staticHeader.style.display = 'block';
    }
}

//? Skip pairing and go directly to control panel
function skipPairing(event) {
    // Stop the event from bubbling up to the splash screen click handler
    if (event) {
        event.stopPropagation();
    }

    const splash = document.getElementById('splash');
    const mainContent = document.getElementById('mainContent');
    const statusHeader = document.querySelector('.status-header');
    const staticHeader = document.querySelector('.static-header');

    // Vibrate on tap
    vibrateDevice();

    // Hide splash and show control panel
    if (splash) {
        splash.style.display = 'none';
    }
    if (mainContent) {
        mainContent.style.display = 'flex';
    }

    // Show headers with animation
    if (statusHeader) {
        statusHeader.style.display = 'block';
    }
    if (staticHeader) {
        staticHeader.style.display = 'block';
    }

    console.log('Pairing skipped - running in offline mode');
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
// Initialize gyroscope after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get the moving element
    var element = document.getElementById("movingElement");

    if (!element) {
        console.warn('movingElement not found for gyroscope');
        return;
    }

    // Initialize variables to store gyroscope data
    var xRotation = 0;
    var yRotation = 0;

    // Function to handle device orientation changes
    function handleOrientation(event) {
        if (!event.beta || !event.gamma) return;

        xRotation = clamp((event.beta - 90) * 0.4, -70, 30); // x-axis rotation (tilt forward/backward)
        yRotation = clamp(event.gamma * 0.6, -100, 20); // y-axis rotation (tilt left/right)

        // Update element's position using CSS translate
        element.style.transform = "translate(" + yRotation + "px, " + xRotation + "px)";
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Add event listener for device orientation
    window.addEventListener("deviceorientation", handleOrientation);

    console.log('Gyroscope initialized for dotted-array');
});

//* ------- BLE Characteristics Toggle ---------
function toggleBLECharacteristics() {
    const bleCharContent = document.getElementById('bleCharContent');
    const bleCharBtn = document.getElementById('bleCharBtn');

    if (bleCharContent.style.display === 'none') {
        // Show BLE characteristics
        bleCharContent.style.display = 'block';
        bleCharBtn.classList.add('expanded');
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

//? Toast Notification System
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Add icon based on type
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            container.removeChild(toast);
        }, 300); // Match animation duration
    }, duration);
}

//? Haptic Feedback Patterns
function vibrateDevice(pattern = 'light') {
    if (!navigator.vibrate) return;

    const patterns = {
        light: 30,           // Quick tap
        medium: 50,          // Button press
        heavy: 80,           // Important action
        success: [30, 80, 30], // Double tap
        error: [50, 120, 50, 120, 50], // Triple pulse
        long: 100            // Long press
    };

    navigator.vibrate(patterns[pattern] || patterns.light);
}

//? BLE Write Visual Feedback
function triggerBLEWriteFeedback() {
    const statusPill = document.getElementById('s-pill');
    if (!statusPill) return;

    // Add the pulse animation class
    statusPill.classList.add('ble-writing');

    // Remove the class after animation completes (0.4s * 2 iterations = 0.8s)
    setTimeout(() => {
        statusPill.classList.remove('ble-writing');
    }, 800);
}
