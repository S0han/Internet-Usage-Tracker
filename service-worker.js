let startTime;
let stopwatchInterval;
let tabClosed = false;

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
    tabClosed = false;
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

// Consolidated function to handle accumulated time and logs
function handleAccumulatedTime(exitTime, currentDate) {
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
      console.log(`Accumulated time for ${currentDate}: ${accumulatedTime}`);
    });

    // Reset tabClosed flag here after logging accumulated time
    tabClosed = false;
  });
}

// Consolidated function to reset timer value
function resetTimerValue() {
  chrome.storage.local.set({ timerValue: "00:00:00" }, function () {
    var error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
    }
    console.log("Timer reset in back-end");
  });
}

// Consolidated function to send message to background
function sendMessageToBackground() {
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
}

//create to backpage upon button press
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.redirect) {
        chrome.tabs.create({ url: 'backPage.html' });
    }
});

// Consolidated logic for tab removal and tab activation
chrome.tabs.onRemoved.addListener(async function (tabId, removeInfo) {
  try {
    const exitTime = await getTimerValueFromStorage();
    const currentDate = getFormattedDate();

    if (typeof exitTime === 'string') {
      const activeTabs = await new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => resolve(tabs));
      });

      const isTabActive = activeTabs.some((tab) => tab.id === tabId);

      if (!isTabActive) {
        handleAccumulatedTime(exitTime, currentDate);
        resetTimerValue();
        stopStopwatch();
        sendMessageToBackground();
        console.log("Accumulated time sent");
      }
    } else {
      console.error('Invalid exit time:', exitTime);
      // Handle the case where exitTime is null or invalid
    }
  } catch (error) {
    console.error('Error occurred:', error);
    // Handle other potential errors that might occur in the try block
  }
  console.log("Tab is closed. Unable to send message.");
});

chrome.tabs.onActivated.addListener(async function (activeInfo) {
    try {
      const currentTabId = activeInfo.tabId;
      const currentTab = await new Promise(resolve => chrome.tabs.get(currentTabId, resolve));
  
      const exitTime = await getTimerValueFromStorage();
      const currentDate = getFormattedDate();
  
      if (currentTab.url.includes("youtube.com")) {
        console.log("Tab is on youtube.com");
        startStopwatch();
  
        if (tabClosed) {
          tabClosed = false; // Reset tabClosed only when the tab is on youtube.com
        }
  
        if (exitTime !== null && typeof exitTime === 'string' && !tabClosed) {
          handleAccumulatedTime(exitTime, currentDate);
        } else if (exitTime === null && !tabClosed) {
          console.log('No exit time stored yet.');
        } else {
          console.error('Invalid exit time:', exitTime);
          // Handle the case where exitTime is not a string or tabClosed is true
        }
      } else {
        console.log("Tab is not on youtube.com");
        if (!tabClosed) {
          stopStopwatch(); // Stop the stopwatch if the tab is not on youtube.com and was previously open
          tabClosed = true; // Set tabClosed to true when the tab is not on youtube.com
        }
  
        if (exitTime !== null && typeof exitTime === 'string' && tabClosed) {
          handleAccumulatedTime(exitTime, currentDate);
          resetTimerValue(); // Reset the timer value when switching away from the YouTube tab
        } else if (exitTime === null && tabClosed) {
          console.log('No exit time stored yet.');
        } else {
          console.error('Invalid exit time or tabClosed is false:', exitTime);
          // Handle the case where exitTime is not a string or tabClosed is false
        }
      }
    } catch (error) {
      console.error('Error occurred:', error);
      // Handle other potential errors that might occur in the try block
    }
});