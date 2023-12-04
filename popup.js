//Apply stopwatch principles to code
let startTime;                                                                                  //start
let stopwatchInterval;                                                                          //interval     
let elapsedPausedTime = 0;                                                                      //keep track of time while stopped

function initAndStartStopwatch() {
    if (!localStorage.getItem('startTime')) {                                                   // Check if 'startTime' is present in localStorage
        startTime = new Date().getTime();
        localStorage.setItem('startTime', startTime);
    } else {
        startTime = parseInt(localStorage.getItem('startTime'));
        elapsedPausedTime = parseInt(localStorage.getItem('elapsedPausedTime')) || 0;           // Retrieve elapsed paused time
        startStopwatch();
    }
}

function startStopwatch() {
    if (!stopwatchInterval) {
        startTime = new Date().getTime() - elapsedPausedTime;                                   //get the start time
        stopwatchInterval = setInterval(udpateStopwatch, 1000);                                 //get the updated time interval in seconds
    }
}

function stopStopwatch() {
    clearInterval(stopwatchInterval);                                                           //stop the updates to the HTML timer display
    elapsedPausedTime = new Date().getTime() - startTime;                                       //calculate time elapsed since paused
    stopwatchInterval = null;                                                                   //reset the interval variable
    localStorage.setItem('elapsedPausedTime', elapsedPausedTime);                               // Store the elapsed paused time
}

//reset the timer function ----> event listener to check if new day occurs which triggers the reset
function resetStopwatch() {
    stopStopwatch();                                                                            //stop the interval
    elapsedPausedTime = 0;                                                                      //reset variable
    startTime = new Date().getTime();                                                           // Reset start time on reset
    localStorage.setItem('startTime', startTime);
    document.getElementById("stopwatch").innerHTML = "00:00:00";                                //reset the HTML display timer
}

//take the current global time in milliseconds and translate it into updating HTML stopwatch
function udpateStopwatch() {
    let currentTime = new Date().getTime();                                                     //get current time in milliseconds
    let elapsedTime = (currentTime - startTime) / 1000;                     //calculate time elapsed since the start
    let seconds = Math.floor(elapsedTime % 60);                                                 //get the seconds
    let minutes = Math.floor(elapsedTime / 60) % 60;                                            //get the minutes
    let hours = Math.floor(elapsedTime / 3600);                                                 //get the hours
    let displayTime = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);                     //format the display time
    
    let currentDayStart = new Date();
    currentDayStart.setHours(0, 0, 0, 0);                                                       //set this time to start of day
    if (new Date(startTime).getTime() < currentDayStart.getTime()) {
        resetStopwatch();
        startTime = new Date().getTime();                                                       //update the start time for the new day
        localStorage.setItem("startTime", startTime);                                           //store the new start time
        startStopwatch();
    }
    
    document.getElementById("stopwatch").innerHTML = displayTime;                               //update the HTML to show new display time **RESET**
}

//check if the section of the timmer hh/mm/ss are abover or below 10 to see whether or not to add a leading 0 to keep format
function pad(number) {
    return (number < 10 ? "0" : "") + number;
}



//checks to see if a specific URL is opened which will trigger a timer.    **START**
chrome.webNavigation.onDOMContentLoaded.addListener(function(tab) {
    if(tab.frameId === 0 && tab.url.includes("youtube.com")) {
        console.log("Youtube has been loaded...starting timer");                                //upload notification to console ---> can be deleted after testing
        initAndStartStopwatch();                                                                //start timing usage
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
        if (tab && tab.url.includes("youtube.com")) {                                         //this is where we define the site we want to monitor
            console.log("tab with URL " + tab.url + " was closed.")                             //stop timing usage
            stopStopwatch();                                                                    //stop the stop watch      
            
            //check date and if same day continue from time saved in local storage
            let currentDate = new Date();                                                       
            let storedDate = new Date(parseInt(localStorage.getItem('startTime')));             //store the current start time to track where it left off
            if (currentDate.toDateString() === storedDate.toDateString()) {
                localStorage.setItem('elapsedPausedTime', elapsedPausedTime);                   // Store the elapsed paused time
            }   
        }
    });
});
