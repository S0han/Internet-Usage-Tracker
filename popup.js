// Apply stopwatch principles to code
let startTime;
let stopwatchInterval;
let elapsedPausedTime = 0;

function startStopwatch() {
    let storedElapsedPausedTime = JSON.parse(sessionStorage.getItem('elapsedPausedTime'));
  
    if (storedElapsedPausedTime !== null) {
      elapsedPausedTime = storedElapsedPausedTime; // use stored elapsed paused time
    }
  
    if (!stopwatchInterval) {
      let storedStartTime = JSON.parse(sessionStorage.getItem('startTime'));
      startTime = storedStartTime ? storedStartTime - elapsedPausedTime : new Date().getTime();
      stopwatchInterval = setInterval(updateStopwatch, 1000);
    }
}

function stopStopwatch() {
    clearInterval(stopwatchInterval);
    elapsedPausedTime = 0;
    sessionStorage.setItem('elapsedPausedTime', JSON.stringify(elapsedPausedTime));
    stopwatchInterval = null;
}

function resetStopwatch() {
    stopStopwatch();
    elapsedPausedTime = 0;
    startTime = new Date().getTime();
    document.getElementById("stopwatch").innerHTML = "00:00:00";
}

function updateStopwatch() {
    let storedStartTime = JSON.parse(sessionStorage.getItem('startTime'));
    let storedElapsedPausedTime = JSON.parse(sessionStorage.getItem('elapsedPausedTime')) || 0; // If null, set to 0
  
    let currentTime = new Date().getTime();
    let storedDate = new Date(storedStartTime);
  
    if (storedDate.toDateString() === new Date().toDateString()) {
      let startTime = storedStartTime - storedElapsedPausedTime;
  
      let elapsedTime = (currentTime - startTime) / 1000;
      let seconds = Math.floor(elapsedTime % 60);
      let minutes = Math.floor(elapsedTime / 60) % 60;
      let hours = Math.floor(elapsedTime / 3600);
      let displayTime = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
  
      console.log(displayTime); // Log elapsed time to check if it's updating correctly
  
      document.getElementById("stopwatch").innerHTML = displayTime;
    } else {
      resetStopwatch();
    }
}

function pad(number) {
    return (number < 10 ? "0" : "") + number;
}

// START: Timer on YouTube page load
chrome.webNavigation.onDOMContentLoaded.addListener(function(tab) {
    if(tab.frameId === 0 && tab.url.includes("youtube.com")) {
        console.log("Youtube has been loaded...starting timer");
        startStopwatch();
    }
});

// Redirect from the pop-up to a specific page
document.addEventListener('DOMContentLoaded', function () {
    const redirButton = document.getElementById('backPageRedirect');
    redirButton.addEventListener('click', function () {
        chrome.tabs.create({url: chrome.runtime.getURL('backpage.html')});
    });
});

// Tab closure to stop the timer
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    console.log("Tab with ID " + tabId + " was closed");
    chrome.tabs.get(tabId, function(tab) {
        if (tab && tab.url.includes("youtube.com")) {
            console.log("Tab with URL " + tab.url + " was closed.");
            stopStopwatch();
        }
    });
});
