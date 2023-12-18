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
    
    //TEST CODE ONLY
    //Show what is stored in the local storage data
    // chrome.storage.local.get("timerValue", function(data) {
    //     console.log("Timer Value:", data.timerValue);
    // });
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

// Get today's date in the format MM-DD-YYYY
function getFormattedDate() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}-${day}-${year}`;
}

function addFormattedTime(t1, t2) {
    // Splitting the time strings into arrays of hours, minutes, and seconds
    const split_time1 = t1.split(":").map((x) => parseInt(x));
    const split_time2 = t2.split(":").map((x) => parseInt(x));
  
    // Calculating total seconds for both time strings
    const totalSeconds1 = split_time1[0] * 3600 + split_time1[1] * 60 + split_time1[2];
    const totalSeconds2 = split_time2[0] * 3600 + split_time2[1] * 60 + split_time2[2];
  
    // Adding the total seconds together
    let totalSeconds = totalSeconds1 + totalSeconds2;
  
    // Converting total seconds into hours, minutes, and seconds format
    const new_hr = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const new_min = Math.floor(remainingSeconds / 60);
    const new_sec = remainingSeconds % 60;
  
    // Formatting the accumulated time to HH:MM:SS format
    const accumulatedTime =
      String(new_hr).padStart(2, "0") +
      ":" +
      String(new_min).padStart(2, "0") +
      ":" +
      String(new_sec).padStart(2, "0");
  
    // Returning the accumulated time string
    return accumulatedTime;
}

// Listen for tab closure
chrome.tabs.onRemoved.addListener(async function (tabId, removeInfo) {
    try {
        const exitTime = await getTimerValueFromStorage();
        const currentDate = getFormattedDate();

        // Check if exitTime is a valid string
        if (typeof exitTime === 'string') {
            chrome.tabs.query({ active: true }, function (tabs) {
                const activeTab = tabs.find(tab => tab.id === tabId);
                if (!activeTab) {
                    console.log("Tab is not active, performing actions...");
                    
                    console.log(exitTime || "Timer value not found in storage");
                    
                    //Handle the daily accumulated time
                    chrome.storage.local.get(currentDate, (data) => {
                        let accumulatedTime = data[currentDate];
                        // Check if accumulatedTime is a valid string before using addFormattedTime
                        if (typeof accumulatedTime === 'string') {
                            accumulatedTime = addFormattedTime(accumulatedTime, exitTime);
                        } else {
                            // Handle the case where accumulatedTime is null or invalid
                            console.error('Invalid accumulated time:', accumulatedTime);
                            accumulatedTime = exitTime; // Set accumulatedTime to exitTime directly or handle as needed
                        }
                        
                        //Set the accumulated time for today
                        const dailyLog = {};
                        dailyLog[currentDate] = accumulatedTime;
                        chrome.storage.local.set(dailyLog, () => {
                            var error = chrome.runtime.lastError;
                            if (error) {
                                console.error(error);
                            }
                            console.log("Daily time updated in storage");

                            // Fetch and log the updated accumulated time
                            chrome.storage.local.get(currentDate, function (dailyLog) {
                                const updatedTime = dailyLog[currentDate];
                                console.log(`Accumulated time for ${currentDate}: ${updatedTime}`);
                            });
                        });
                    });
                    
                    //reset timer value in storage
                    chrome.storage.local.set({timerValue: 0}, function () {
                        var error = chrome.runtime.lastError;
                        if (error) {
                            console.error(error);
                        }
                        console.log("Timer reset in back-end");
                        
                        //TEST CODE ONLY
                        //Ensure the timerValue is reset
                        // chrome.storage.local.get("timerValue", function(data) {
                        //     console.log("Timer Value:", data.timerValue);
                        // });
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
        } else {
            console.error('Invalid exit time:', exitTime);
            // Handle the case where exitTime is null or invalid
        }
    } catch (error) {
        console.error('Error occurred:', error);
        // Handle other potential errors that might occur in the try block
    }
});

//redirect to backpage.html once message is recieved from content.js upon button click event
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message && message.redirect) {
        // Open a new tab
        chrome.tabs.create({ url: chrome.runtime.getURL('backpage.html') });
    }
});

chrome.tabs.onActivated.addListener(async function (activeInfo) {
    try {
        const currentTabId = activeInfo.tabId;
        const currentTab = await new Promise(resolve => chrome.tabs.get(currentTabId, resolve));

        if (!currentTab.url.includes("youtube.com")) {
            console.log("Tab is not on youtube.com");

            const exitTime = await getTimerValueFromStorage();
            const currentDate = getFormattedDate();

            if (typeof exitTime === 'string') {
                chrome.storage.local.get(currentDate, (data) => {
                    let accumulatedTime = data[currentDate];
                    if (typeof accumulatedTime === 'string') {
                        accumulatedTime = addFormattedTime(accumulatedTime, exitTime);
                    } else {
                        console.error('Invalid accumulated time:', accumulatedTime);
                        accumulatedTime = exitTime;
                    }

                    const dailyLog = {};
                    dailyLog[currentDate] = accumulatedTime;
                    chrome.storage.local.set(dailyLog, () => {
                        var error = chrome.runtime.lastError;
                        if (error) {
                            console.error(error);
                        }
                        console.log("Daily time updated in storage");

                        chrome.storage.local.get(currentDate, function (dailyLog) {
                            const updatedTime = dailyLog[currentDate];
                            console.log(`Accumulated time for ${currentDate}: ${updatedTime}`);
                        });
                    });
                });

                chrome.storage.local.set({ timerValue: 0 }, function () {
                    var error = chrome.runtime.lastError;
                    if (error) {
                        console.error(error);
                    }
                    console.log("Timer reset in back-end");

                    stopStopwatch();

                    chrome.runtime.sendMessage("reset-timer", (response) => {
                        if (chrome.runtime.lastError) {
                            if (chrome.runtime.lastError.message.includes('Could not establish connection')) {
                                console.warn('Tab is closed. Unable to send message.');
                            } else {
                                console.error(chrome.runtime.lastError.message);
                            }
                        } else {
                            console.log("Popup action executed", response);
                        }
                    });
                });
            } else {
                console.error('Invalid exit time:', exitTime);
                // Handle the case where exitTime is null or invalid
            }
        }
    } catch (error) {
        console.error('Error occurred:', error);
        // Handle other potential errors that might occur in the try block
    }
});