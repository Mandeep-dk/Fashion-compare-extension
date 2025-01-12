// Import required modules
const express = require('express'); // For creating the backend server
const puppeteer = require('puppeteer'); // For web scraping using a headless browser
const cheerio = require('cheerio'); // For parsing and extracting data from HTML
const cors = require('cors'); // For enabling Cross-Origin Resource Sharing

// Initialize the express app and set the port
const app = express();
const port = 5000;

// Enable CORS to allow requests from different origins
app.use(cors());

// Route to scrape coupons from Amazon
app.get('/coupon-amazon', async (req, res) => {
    // Launch a new Puppeteer browser instance in headless mode
    const browser = await puppeteer.launch({ 
        headless: 'new', 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage(); // Open a new browser tab

    // Set a user agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Define the URL to scrape Amazon coupons
    const amazonCoupon = `https://couponfollow.com/site/amazon.in`;

    // Set the referer header to avoid being blocked
    await page.setExtraHTTPHeaders({ referer: 'https://www.google.com' });

    // Navigate to the coupon page and wait until the DOM content is fully loaded
    await page.goto(amazonCoupon, { waitUntil: 'domcontentloaded' });

    // Extract the page's HTML content
    const amazonHtml = await page.content();
    const amazon = cheerio.load(amazonHtml); // Load the HTML into Cheerio for parsing

    const coupons = []; // Array to store the scraped coupons

    // Scrape all coupon titles
    const couponTitles = [];
    amazon('.offer-title').each((index, element) => {
        couponTitles.push(amazon(element).text().trim());
    });

    // Scrape all coupon codes
    const couponCodes = [];
    amazon('.btn-reveal').each((index, element) => {
        const couponCode = amazon(element).find('.code').text().trim();
        couponCodes.push(couponCode);
    });

    // Combine titles and codes into an array of objects
    couponTitles.forEach((title, index) => {
        const couponCode = couponCodes[index] || 'No code available'; // Handle missing codes
        coupons.push({ title, code: couponCode });
    });

    await browser.close(); // Close the browser

    res.json(coupons); // Send the scraped coupons as a JSON response
});

// Route to scrape coupons from Flipkart
app.get('/coupon-flipkart', async (req, res) => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const flipkartCoupon = `https://www.coupondunia.in/flipkart?subcategories=&banks=&sortBy=popularity&noOfPages=1&tab=coupon&userType=all`;
    await page.goto(flipkartCoupon, { waitUntil: 'domcontentloaded' });

    const flipkartHtml = await page.content();
    const flipkart = cheerio.load(flipkartHtml);

    const coupons = [];
    const couponTitles = [];
    flipkart('.offer-title').each((index, element) => {
        couponTitles.push(flipkart(element).text().trim());
    });

    const couponCodes = [];
    flipkart('.get-codebtn-holder').each((index, element) => {
        const couponCode = flipkart(element).find('.p1-code').text().trim();
        couponCodes.push(couponCode);
    });

    couponTitles.forEach((title, index) => {
        const couponCode = couponCodes[index] || 'No code available';
        coupons.push({ title, code: couponCode });
    });

    await browser.close();

    res.json(coupons);
});

// Route to scrape coupons from Myntra
app.get('/coupon-myntra', async (req, res) => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const myntraCoupon = `https://www.coupondunia.in/myntra?subcategories=&banks=&sortBy=popularity&noOfPages=1&tab=coupon&userType=all`;
    await page.goto(myntraCoupon, { waitUntil: 'domcontentloaded' });

    const myntraHtml = await page.content();
    const myntra = cheerio.load(myntraHtml);

    const coupons = [];
    const couponTitles = [];
    myntra('.offer-title').each((index, element) => {
        couponTitles.push(myntra(element).text().trim());
    });

    const couponCodes = [];
    myntra('.get-codebtn-holder').each((index, element) => {
        const couponCode = myntra(element).find('.p1-code').text().trim();
        couponCodes.push(couponCode);
    });

    couponTitles.forEach((title, index) => {
        const couponCode = couponCodes[index] || 'No code available';
        coupons.push({ title, code: couponCode });
    });

    await browser.close();

    res.json(coupons);
});

// Start the server and listen on the defined port
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
