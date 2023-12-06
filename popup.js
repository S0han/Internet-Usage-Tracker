//Apply stopwatch principles to code
let startTime;                                                                                  //start
let stopwatchInterval;                                                                          //interval     
let elapsedPausedTime = 0;                                                                      //keep track of time while stopped


function startStopwatch() {
    let storedElapsedPausedTime = JSON.parse(localStorage.getItem('elapsedPausedTime'));
  
    if (storedElapsedPausedTime !== null) {
      elapsedPausedTime = storedElapsedPausedTime; // use stored elapsed paused time
    }
  
    if (!stopwatchInterval) {
      let storedStartTime = JSON.parse(localStorage.getItem('startTime'));
      startTime = storedStartTime ? storedStartTime - elapsedPausedTime : new Date().getTime();
      stopwatchInterval = setInterval(updateStopwatch, 1000);
    }
}

function stopStopwatch() {
    clearInterval(stopwatchInterval);
    elapsedPausedTime = 0; // Reset elapsed time to zero when stopped
    localStorage.setItem('elapsedPausedTime', JSON.stringify(elapsedPausedTime));
    stopwatchInterval = null;
}

//reset the timer function ----> event listener to check if new day occurs which triggers the reset
function resetStopwatch() {
    stopStopwatch();                                                                            //stop the interval
    elapsedPausedTime = 0;                                                                      //reset variable
    startTime = new Date().getTime();                                                           // Reset start time on reset
    document.getElementById("stopwatch").innerHTML = "00:00:00";                                //reset the HTML display timer
}

//take the current global time in milliseconds and translate it into updating HTML stopwatch
function updateStopwatch() {
    let storedStartTime = JSON.parse(localStorage.getItem('startTime'));
    let storedElapsedPausedTime = JSON.parse(localStorage.getItem('elapsedPausedTime'));
  
    if (storedElapsedPausedTime !== null && storedElapsedPausedTime !== 0) {
      elapsedPausedTime = storedElapsedPausedTime; // use stored elapsed paused time
    }
  
    let currentTime = new Date().getTime();
    let storedDate = new Date(storedStartTime);
  
    if (storedDate.toDateString() === new Date().toDateString()) {
      startTime = storedStartTime - elapsedPausedTime;
  
      let elapsedTime = (currentTime - startTime) / 1000;
      let seconds = Math.floor(elapsedTime % 60);
      let minutes = Math.floor(elapsedTime / 60) % 60;
      let hours = Math.floor(elapsedTime / 3600);
      let displayTime = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
  
      document.getElementById("stopwatch").innerHTML = displayTime;
    } else {
      resetStopwatch();
    }
}


//check if the section of the timmer hh/mm/ss are abover or below 10 to see whether or not to add a leading 0 to keep format
function pad(number) {
    return (number < 10 ? "0" : "") + number;
}



//checks to see if a specific URL is opened which will trigger a timer.    **START**
chrome.webNavigation.onDOMContentLoaded.addListener(function(tab) {
    if(tab.frameId === 0 && tab.url.includes("youtube.com")) {
        console.log("Youtube has been loaded...starting timer");                                //upload notification to console ---> can be deleted after testing
        startStopwatch();                                                                       //start timing usage
    }
});

//redirect from the pop-up upon clicking the button in the chrome extension (changes also made to the manifest.json file)
document.addEventListener('DOMContentLoaded', function () {
    const redirButton = document.getElementById('backPageRedirect');
    redirButton.addEventListener('click', function () {
        chrome.tabs.create({url: chrome.runtime.getURL('backpage.html')});                      //this is the site where the reports are stored
    });
});

//checks to see if a specific URL is closed which will stop the timer
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    console.log("Tab with ID " + tabId + " was closed");
    chrome.tabs.get(tabId, function(tab) {
        if (tab && tab.url.includes("youtube.com")) {
            console.log("tab with URL " + tab.url + " was closed.");
            stopStopwatch();                                                                    // Stop the stopwatch
        }
    });
});
