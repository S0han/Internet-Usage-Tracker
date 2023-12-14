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

    // Store timer value in chrome.storage
    chrome.storage.local.set({ timerValue: displayTime });
}

function pad(number) {
    return (number < 10 ? "0" : "") + number;
}

// Start timer immediately when the specified tab (YouTube) page loads
chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {
    if (details.frameId === 0 && details.url.includes("youtube.com")) {
        startStopwatch();
        console.log("Timer started");
    }
});

function getTimerValueFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get("timerValue", (data) => {
            resolve(data.timerValue || null);
        });
    });
}

// Listen for tab closure or navigation
chrome.tabs.onRemoved.addListener(async function (tabId, removeInfo) {
    const exitTime = await getTimerValueFromStorage();
    chrome.tabs.query({ active: true }, function (tabs) {
        const activeTab = tabs.find(tab => tab.id === tabId);
        if (!activeTab) {
            console.log("Tab is not active, performing actions...");
            
            console.log(exitTime || "Timer value not found in storage");
            
            // Clear storage
            chrome.storage.local.clear(function () {
                var error = chrome.runtime.lastError;
                if (error) {
                    console.error(error);
                }
                console.log("Timer reset in back-end");
            });

            // Stop the stopwatch (if necessary)
            stopStopwatch();

            // Send a message to a content script or background script to update the display
            chrome.runtime.sendMessage("reset-timer", (response) => {
                if (chrome.runtime.lastError) {
                    // Check if the error is due to a disconnected port (closed tab)
                    if (chrome.runtime.lastError.message.includes('Could not establish connection')) {
                        console.warn('Tab is closed. Unable to send message.');
                    } else {
                        console.error(chrome.runtime.lastError.message);
                    }
                } else {
                    console.log("Popup action executed", response);
                }
            });                     
        }
    });
});

