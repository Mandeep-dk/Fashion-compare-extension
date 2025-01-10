// content.js (Content Script in Chrome Extension)
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTabUrl = tabs[0].url;
    console.log(currentTabUrl); // Logs the URL of the active tab

    // Now, call the backend with the active tab URL and determine the platform
    if (currentTabUrl.includes('www.amazon.in')) {
        getScrapedData(currentTabUrl, 'amazon');
    } else if (currentTabUrl.includes('www.flipkart.com')) {
        getScrapedData(currentTabUrl, 'flipkart');
    } else {
        console.log('This URL is neither from Amazon nor Flipkart.');
    }
});

const getScrapedData = async (currentTabUrl, platform) => {
    try {
        const response = await fetch(`http://localhost:3000/scrape-${platform}?url=${encodeURIComponent(currentTabUrl)}`);
        const data = await response.json();

        console.log(`${platform} Title:`, data.title);
        console.log(`${platform} Price:`, data.price);
    } catch (error) {
        console.error('Error fetching scraped data:', error);
    }
};
