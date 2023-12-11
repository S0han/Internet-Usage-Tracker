// Retrieve timer value from chrome.storage
chrome.storage.local.get("timerValue", function(data) {
    let timerValue = data.timerValue || "00:00:00"; // Default value if not set
    document.getElementById("stopwatch").innerHTML = timerValue;
});