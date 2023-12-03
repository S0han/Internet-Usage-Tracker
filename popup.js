//Apply stopwatch principles to code
let startTime;                      //start time
let stopwatchInterval;              //interval     
let elapsedPausedTime = 0;          //keep track of time while stopped


//checks to see if a specific URL is opened which will trigger a timer.
chrome.webNavigation.onDOMContentLoaded.addListener(function(tab) {
    if(tab.frameId === 0 && tab.url.includes("###############")) {
        console.log("Youtube has been loaded...starting timer");                    //upload notification to console ---> can be deleted after testing
        if (!stopwatchInterval) {
            startTime = new Date().getTime() - elapsedPausedTime;                   //get the start time
            stopwatchInterval = setInterval(udpateStopwatch, 1000);                 //get the updated time interval in seconds
        }
    }
});

function stopStopwatch() {
    clearInterval(stopwatchInterval);                                               //stop the updates to the HTML timer display
    elapsedPausedTime = new Date().getTime() - startTime                            //calculate time elapsed since paused
    stopwatchInterval = null;                                                       //reset the interval variable
}

//reset the timer function ----> event listener to check if new day occurs which triggers the reset
function resetStopwatch() {
    stopStopwatch();                                                                //stop the interval
    elapsedPausedTime = 0;                                                          //reset variable
    document.getElementById("stopwatch").innerHTML = "00:00:00";                    //reset the HTML display timer
}

//take the current global time in milliseconds and translate it into updating HTML stopwatch
function udpateStopwatch() {
    let currentTime = new Date().getTime();                                         //get current time
    let elapsedTime = currentTime - startTime;                                      //calculate time elapsed since the start
    let seconds = Math.floor(elapsedTime / 1000) % 60;                              //get the seconds
    let minutes = Math.floor(elapsedTime / 1000 / 60) % 60;                         //get the minutes
    let hours = Math.floor(elapsedTime / 1000 / 60/ 60);                            //get the hours
    let displayTime = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);         //format the display time
    document.getElementById("stopwatch").innerHTML = displayTime;                   //update the HTML to show new display time
}

function pad(number) {
    return (number < 10 ? "0" : "") + number
}






//redirect from the pop-up upon clicking the button in the chrome extension (changes also made to the manifest.json file)
document.addEventListener('DOMContentLoaded', function () {
    const redirButton = document.getElementById('backPageRedirect');
    redirButton.addEventListener('click', function () {
        chrome.tabs.create({url: chrome.runtime.getURL('backpage.html')});
    });
});