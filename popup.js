//redirect from the pop-up upon clicking the button in the chrome extension (changes also made to the manifest.json file)
document.addEventListener('DOMContentLoaded', function () {
    const redirButton = document.getElementById('backPageRedirect');
    redirButton.addEventListener('click', function () {
        chrome.tabs.create({url: chrome.runtime.getURL('backpage.html')});
    });
});
