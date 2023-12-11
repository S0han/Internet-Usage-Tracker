chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "updateTimer") {
        // Update the timer displayed in the extension's popup window
        document.getElementById("stopwatch").innerHTML = message.timerValue;
    }
});