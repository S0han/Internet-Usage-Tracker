let startTime;
let stopwatchInterval;
let isTabVisible = true; // Track tab visibility

function startStopwatch() {
    if (!stopwatchInterval) {
        startTime = new Date().getTime();
        stopwatchInterval = setInterval(updateStopwatch, 1000);
    }
}

function stopStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
}

function updateStopwatch() {
    if (isTabVisible) {
        let currentTime = new Date().getTime();
        let elapsedTime = (currentTime - startTime) / 1000;

        let seconds = Math.floor(elapsedTime % 60);
        let minutes = Math.floor(elapsedTime / 60) % 60;
        let hours = Math.floor(elapsedTime / 3600);

        let displayTime = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
        document.getElementById("stopwatch").innerHTML = displayTime; // Update the display
    }
}

function pad(number) {
    return (number < 10 ? "0" : "") + number;
}

function handleVisibilityChange() {
    isTabVisible = !document.hidden;
    if (!isTabVisible) {
        stopStopwatch();
    }
}

document.addEventListener('visibilitychange', handleVisibilityChange);

// Start timer immediately when the specified tab (YouTube) page loads
chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {
    if (details.frameId === 0 && details.url.includes("youtube.com")) {
        startStopwatch();
    }
});

// Listen for tab closure or navigation
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (removeInfo.isWindowClosing && !isTabVisible && removeInfo.url.includes("youtube.com")) {
        stopStopwatch();
    }
});