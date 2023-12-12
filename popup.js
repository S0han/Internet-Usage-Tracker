// Retrieve timer value from chrome.storage
chrome.storage.local.get("timerValue", function(data) {
    let timerValue = data.timerValue || "00:00:00"; // Default value if not set
    document.getElementById("stopwatch").innerHTML = timerValue;
});

//Reset the timer value and get the service-worker to console log success
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'reset-timer') {
        document.getElementById("stopwatch").innerHTML = "00:00:00";
        sendResponse("Popup action executed");
    }
});