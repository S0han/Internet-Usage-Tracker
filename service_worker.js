let startTime;
let stopwatchInterval;

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
    let currentTime = new Date().getTime();
    let elapsedTime = (currentTime - startTime) / 1000;

    let seconds = Math.floor(elapsedTime % 60);
    let minutes = Math.floor(elapsedTime / 60) % 60;
    let hours = Math.floor(elapsedTime / 3600);

    let displayTime = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);

    // Send a message to the content script with the updated timer value
    chrome.tabs.query({ url: "*://*.youtube.com/*" }, function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: "updateTimer", timerValue: displayTime });
        });
    });
}

function pad(number) {
    return (number < 10 ? "0" : "") + number;
}

// Start timer immediately when the specified tab (YouTube) page loads
chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {
    if (details.frameId === 0 && details.url.includes("youtube.com")) {
        startStopwatch();
    }
});

// Listen for tab closure or navigation
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (removeInfo.isWindowClosing && removeInfo.url.includes("youtube.com")) {
        stopStopwatch();
    }
});