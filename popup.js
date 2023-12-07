let startTime;
let stopwatchInterval;

function startStopwatch() {
    if (!stopwatchInterval) {
        startTime = startTime || new Date().getTime();
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
    document.getElementById("stopwatch").innerHTML = displayTime;
}

function pad(number) {
    return (number < 10 ? "0" : "") + number;
}

// Start timer immediately when page loads
startStopwatch();

// Stop timer when tab is closed/left
window.addEventListener('beforeunload', stopStopwatch);
