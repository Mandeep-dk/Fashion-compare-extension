// content.js (Content Script in Chrome Extension)

// Query the active tab in the current browser window
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    // Get the URL of the active tab
    const currentTabUrl = tabs[0].url;
    console.log(currentTabUrl); // Logs the URL of the active tab for debugging

    // Check if the URL belongs to Amazon or Flipkart and call the backend accordingly
    if (currentTabUrl.includes('www.amazon.in')) {
        // If the URL is from Amazon, call the backend with 'amazon' as the platform
        getScrapedData(currentTabUrl, 'amazon');
    } else if (currentTabUrl.includes('www.flipkart.com')) {
        // If the URL is from Flipkart, call the backend with 'flipkart' as the platform
        getScrapedData(currentTabUrl, 'flipkart');
    } else {
        // If the URL is from neither Amazon nor Flipkart, log a message
        console.log('This URL is neither from Amazon nor Flipkart.');
    }
});