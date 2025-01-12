// server.js (Backend)
const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const stringSimilarity = require('string-similarity');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());

//use the required endpoints for reverse proxy 
// const { createProxyMiddleware } = require('http-proxy-middleware');
// app.use('/scrape-amazon', createProxyMiddleware({ target: 'http://localhost:5000/', changeOrigin: true }));

const cleanPrice = (priceString) => {
    const cleanedPrice = priceString.replace(/[^\d.]/g, '').trim();  // Remove non-numeric characters
    return parseFloat(cleanedPrice);
};

// Route to scrape Amazon product information
app.get('/scrape-amazon', async (req, res) => {
    const { url } = req.query; // Get the Amazon product URL from query params

    // Extract the product name from the URL using regex
    const regex = /\/dp\/[^/]+\/.*?keywords=([^&]*)/;
    const match = url.match(regex);

    let productNameFromUrl = '';
    if (match && match[1]) {
        productNameFromUrl = decodeURIComponent(match[1]).replace(/\+/g, ' ');
    } else {
        console.log('Product name not found');
    }

    // Search for the product on Amazon using the extracted keywords
    const amazonUrl = await fetch(`https://www.amazon.in/s?k=${encodeURIComponent(productNameFromUrl)}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
    });

    // Parse the Amazon search result HTML using Cheerio
    const amazonHtml = await amazonUrl.text();
    const amazon = cheerio.load(amazonHtml);

    // Extract product prices from Amazon search results
    const amazonPrice = [];
    amazon('.a-price').each((index, element) => {
        const price = amazon(element).find('.a-price-whole').text().trim();
        if (price) {
            const cleanedPrice = cleanPrice(price);
            if (!isNaN(cleanedPrice) && cleanedPrice > 100) { // Only consider prices above 100
                amazonPrice.push(cleanedPrice);
            }
        }
    });

    // Use Puppeteer to scrape additional details from the product page
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-extensions']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Extract product title and price from the product page
    const content = await page.content();
    const $ = cheerio.load(content);
    const amazonActualTitle = $('#productTitle').text().trim() || 'Title not found';
    const amazonActualPrice = $('.a-price-whole').first().text().trim() || 'Price not found';

    await page.setCacheEnabled(false);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await browser.close();

    // Scrape Myntra for similar products
    const browser1 = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-extensions']
    });
    const page1 = await browser1.newPage();
    await page1.setExtraHTTPHeaders({
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    });
    await page1.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const myntraUrl = `https://www.myntra.com/${encodeURIComponent(productNameFromUrl)}`;
    await page1.goto(myntraUrl, { waitUntil: 'domcontentloaded' });

    // Wait for products to load and extract product details
    await page1.waitForSelector('.product-base');
    const myntraProducts = await page1.evaluate(() => {
        const products = [];
        document.querySelectorAll('.product-base').forEach((product) => {
            const linkElement = product.querySelector('a');
            const discountedPrice = product.querySelector('.product-discountedPrice');
            const link = linkElement ? linkElement.href : null;
            const price = discountedPrice ? parseInt(discountedPrice.innerText.trim().replace(/[^\d]/g, ''), 10) : null;
            const title = product.querySelector('.product-product') ? product.querySelector('.product-product').innerText.trim() : null;
            if (link && price && title) {
                products.push({ link, price, title });
            }
        });
        return products;
    });

    await browser1.close();

    // Scrape Flipkart for similar products
    const browser2 = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page2 = await browser2.newPage();
    await page2.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const flipkartSearchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(productNameFromUrl)}`;
    await page2.goto(flipkartSearchUrl, { waitUntil: 'networkidle2' });

    const flipkartHtml = await page2.content();
    const flipkart = cheerio.load(flipkartHtml);

    const flipkartProducts = [];
    flipkart('a[target="_blank"]').each((index, element) => {
        const productElement = flipkart(element);
        const productLink = productElement.attr('href');
        const regex = /\/([^\/]+)\/p\//;
        const match = productLink.match(regex);
        let productNameFromUrl = '';
        if (match && match[1]) {
            productNameFromUrl = decodeURIComponent(match[1]).replace(/\+/g, ' ');
        } else {
            // console.log('Product name not found');
        }
        const fullLink = `https://www.flipkart.com${productLink}`;
        const priceText = productElement.find('.Nx9bqj').text().trim();
        if (productLink && priceText && productNameFromUrl) {
            flipkartProducts.push({
                link: fullLink,
                price: cleanPrice(priceText),
                title: productNameFromUrl
            });
        }
    });

    await browser2.close();

    // Filter products with prices lower than the Amazon price and compare similarity
    const similarPrices = [];
    const filteredMyntraProducts = myntraProducts.filter(({ price }) => price < Number(amazonActualPrice));
    const filteredFlipkartProducts = flipkartProducts.filter(({ price }) => price < Number(amazonActualPrice));

    filteredMyntraProducts.forEach(({ price: myntraPrice, link: myntraLink, title: myntraTitle }) => {
        const similarityMyntra = stringSimilarity.compareTwoStrings(amazonActualTitle, myntraTitle);
        if (similarityMyntra > 0.3) {
            similarPrices.push({
                myntraLink,
                flipkartLink: null,
                amazonPrice: Number(amazonActualPrice),
                myntraPrice,
                flipkartPrice: null,
            });
        }
    });

    filteredFlipkartProducts.forEach(({ price: flipkartPrice, link: flipkartLink, title: flipkartTitle }) => {
        const similarityFlipkart = stringSimilarity.compareTwoStrings(amazonActualTitle, flipkartTitle);
        if (similarityFlipkart > 0.3) {
            similarPrices.push({
                myntraLink: null,
                flipkartLink,
                amazonPrice: Number(amazonActualPrice),
                myntraPrice: null,
                flipkartPrice,
            });
        }
    });

    // Combine products from both Myntra and Flipkart based on similarity
    filteredMyntraProducts.forEach(({ price: myntraPrice, link: myntraLink, title: myntraTitle }) => {
        filteredFlipkartProducts.forEach(({ price: flipkartPrice, link: flipkartLink, title: flipkartTitle }) => {
            const similarityFlipkart = stringSimilarity.compareTwoStrings(amazonActualTitle, flipkartTitle);
            const similarityMyntra = stringSimilarity.compareTwoStrings(amazonActualTitle, myntraTitle);
            if (similarityFlipkart > 0.3 || similarityMyntra > 0.3) {
                similarPrices.push({
                    myntraLink,
                    flipkartLink,
                    amazonPrice: Number(amazonActualPrice),
                    myntraPrice,
                    flipkartPrice,
                });
            }
        });
    });

    // console.log("Similar Prices with links:", similarPrices);
    res.json(similarPrices);
});

// Define an endpoint to scrape data from Flipkart, Amazon, and Myntra for price comparison
app.get('/scrape-flipkart', async (req, res) => {
    const { url } = req.query; // Get the Flipkart product URL from the query parameters

    // Extract product name from the Flipkart URL using regex
    const regex = /flipkart\.com\/([^\/]+)\/p\//;
    const match = url.match(regex);

    let productNameFromUrl = '';
    if (match && match[1]) {
        // Decode the product name and replace '+' with space
        productNameFromUrl = decodeURIComponent(match[1]).replace(/\+/g, ' ');
    } else {
        // console.log('Product name not found');
    }

    // Fetch search results for the product on Amazon
    const amazonUrl = await fetch(`https://www.amazon.in/s?k=${encodeURIComponent(productNameFromUrl)}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
    });
    const amazonHtml = await amazonUrl.text();
    const amazon = cheerio.load(amazonHtml);

    // Extract product details from Amazon search results
    const amazonProducts = [];
    amazon('.s-main-slot .s-result-item').each((index, element) => {
        const priceText = amazon(element).find('.a-price-whole').text().trim();
        const link = amazon(element).find('a.a-link-normal').attr('href');
        if (priceText && link) {
            amazonProducts.push({
                price: cleanPrice(priceText), // Clean and parse the price
                link: `https://www.amazon.in${link}`,
                title: amazon(element).find('h2').text().trim() // Capture the product title
            });
        }
    });

    // Fetch search results for the product on Flipkart
    const flipkartUrl = await fetch(`https://www.flipkart.com/search?q=${encodeURIComponent(productNameFromUrl)}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
    });
    // console.log(productNameFromUrl); // Log the product name for debugging
    const flipkartHtml = await flipkartUrl.text();
    const flipkart = cheerio.load(flipkartHtml);

    // Extract product details from Flipkart search results
    const flipkartProducts = [];
    flipkart('._1sdMkc a').each((index, element) => {
        const productLink = flipkart(element).attr('href');
        const priceText = flipkart(element).find('.Nx9bqj').text().trim();

        if (productLink && priceText) {
            flipkartProducts.push({
                link: `https://www.flipkart.com${productLink}`,
                price: cleanPrice(priceText),
                title: flipkart(element).find('.IRpwTa').text().trim() // Capture the product title
            });
        }
    });

    // Launch Puppeteer for scraping Myntra data
    const browser1 = await puppeteer.launch({
        headless: true, // Run without a UI
        args: ['--no-sandbox', '--disable-extensions']
    });

    const page1 = await browser1.newPage();
    await page1.setExtraHTTPHeaders({
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    });

    await page1.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Visit the Myntra search page
    const myntraUrl = `https://www.myntra.com/${encodeURIComponent(productNameFromUrl)}`;
    await page1.goto(myntraUrl, { waitUntil: 'domcontentloaded' });

    // Wait for product elements to load on Myntra
    await page1.waitForSelector('.product-base');

    // Extract product details from Myntra
    const myntraProducts = await page1.evaluate(() => {
        const products = [];
        document.querySelectorAll('.product-base').forEach((product) => {
            const linkElement = product.querySelector('a');
            const discountedPrice = product.querySelector('.product-discountedPrice');

            const link = linkElement ? linkElement.href : null;
            const price = discountedPrice ? parseInt(discountedPrice.innerText.trim().replace(/[^\d]/g, ''), 10) : null;
            const title = product.querySelector('.product-product') ? product.querySelector('.product-product').innerText.trim() : null;

            if (link && price && title) {
                products.push({ link, price, title });
            }
        });
        return products; // Return the products array
    });

    await browser1.close(); // Close the Puppeteer browser instance

    // Use Puppeteer to scrape actual Flipkart product details
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-extensions']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const content = await page.content();
    const $ = cheerio.load(content);

    // Extract Flipkart product title and price
    const flipkartActualTitle = $('.VU-ZEz').text().trim() || 'Title not found';
    const price = $('.Nx9bqj.CxhGGd').text().trim() || 'Price not found';
    const flipkartActualPrice = cleanPrice(price);

    await browser.close(); // Close Puppeteer

    const similarPrices = [];

    // Filter Amazon products with price less than Flipkart's price
    const filteredAmazonProducts = amazonProducts.filter(({ price }) => price < flipkartActualPrice);

    // Filter Myntra products with price less than Flipkart's price
    const filteredMyntraProducts = myntraProducts.filter(({ price }) => price < flipkartActualPrice);

    // Compare titles for similarity and add Amazon products
    filteredAmazonProducts.forEach(({ price: amazonPrice, link: amazonLink, title: amazonTitle }) => {
        const similarityAmazon = stringSimilarity.compareTwoStrings(flipkartActualTitle, amazonTitle);
        if (similarityAmazon > 0.3) {
            similarPrices.push({
                amazonLink,
                myntraLink: null,
                amazonPrice,
                flipkartPrice: flipkartActualPrice,
            });
        }
    });

    // Compare titles for similarity and add Myntra products
    filteredMyntraProducts.forEach(({ price: myntraPrice, link: myntraLink, title: myntraTitle }) => {
        const similarityMyntra = stringSimilarity.compareTwoStrings(flipkartActualTitle, myntraTitle);

        if (similarityMyntra > 0.3) {
            similarPrices.push({
                amazonLink: null,
                myntraLink,
                flipkartPrice: flipkartActualPrice,
                amazonPrice: null,
                myntraPrice,
            });
        }
    });

    // Combine Amazon and Myntra products if both match the conditions
    filteredAmazonProducts.forEach(({ price: amazonPrice, link: amazonLink, title: amazonTitle }) => {
        filteredMyntraProducts.forEach(({ price: myntraPrice, link: myntraLink, title: myntraTitle }) => {
            const similarityAmazon = stringSimilarity.compareTwoStrings(flipkartActualTitle, myntraTitle);
            const similarityMyntra = stringSimilarity.compareTwoStrings(flipkartActualTitle, amazonTitle);

            if (similarityAmazon > 0.3 || similarityMyntra > 0.3) {
                similarPrices.push({
                    amazonLink,
                    myntraLink,
                    flipkartPrice: flipkartActualPrice,
                    amazonPrice,
                    myntraPrice,
                });
            }
        });
    });

    res.json(similarPrices); // Send the data as a JSON response
});



// Route to scrape Myntra and compare prices with Amazon and Flipkart
app.get('/scrape-myntra', async (req, res) => {
    const { url } = req.query; // Extract URL from query parameters

    // Extract product name from Myntra URL using regex
    const regex = /myntra\.com\/[^\/]+\/[^\/]+\/([^\/]+)\//;
    const match = url.match(regex);

    let productNameFromUrl = '';
    if (match && match[1]) {
        productNameFromUrl = decodeURIComponent(match[1]).replace(/\+/g, ' ');
    } else {
        // console.log('Product name not found');
    }

    // Fetch search results from Amazon
    const amazonUrl = await fetch(`https://www.amazon.in/s?k=${encodeURIComponent(productNameFromUrl)}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
    });
    const amazonHtml = await amazonUrl.text();
    const amazon = cheerio.load(amazonHtml);

    // Parse Amazon products from the search results
    const amazonProducts = [];
    amazon('.s-main-slot .s-result-item').each((index, element) => {
        const priceText = amazon(element).find('.a-price-whole').text().trim();
        const link = amazon(element).find('a.a-link-normal').attr('href');
        if (priceText && link) {
            amazonProducts.push({
                price: cleanPrice(priceText),
                link: `https://www.amazon.in${link}`,
                title: amazon(element).find('h2').text().trim() // Capture the product title
            });
        }
    });

    // Launch Puppeteer for Flipkart scraping
    const browser2 = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page2 = await browser2.newPage();

    // Set user-agent for Flipkart scraping
    await page2.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Construct the Flipkart search URL
    const flipkartSearchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(productNameFromUrl)}`;

    // Navigate to Flipkart and extract the page content
    await page2.goto(flipkartSearchUrl, { waitUntil: 'networkidle2' });
    const flipkartHtml = await page2.content();
    const flipkart = cheerio.load(flipkartHtml);

    // Parse Flipkart products from the search results
    const flipkartProducts = [];
    flipkart('a[target="_blank"]').each((index, element) => {
        const productElement = flipkart(element);
        const productLink = productElement.attr('href');

        // Extract product name from the Flipkart URL
        const regex = /\/([^\/]+)\/p\//;
        const match = productLink.match(regex);

        let productNameFromUrl = '';
        if (match && match[1]) {
            productNameFromUrl = decodeURIComponent(match[1]).replace(/\+/g, ' ');
        } else {
            // console.log('Product name not found');
        }

        const fullLink = `https://www.flipkart.com${productLink}`;

        // Extract product price (handle dynamic class names)
        const priceText = productElement.find('.Nx9bqj').text().trim();

        if (productLink && priceText && productNameFromUrl) {
            flipkartProducts.push({
                link: fullLink,
                price: cleanPrice(priceText),
                title: productNameFromUrl
            });
        }
    });

    await browser2.close();

    // Launch Puppeteer for Myntra product details
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-extensions', '--disable-setuid-sandbox', '--disable-http2']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const content = await page.content();
    const $ = cheerio.load(content);

    // Extract the product title and price from Myntra
    const myntraActualTitle = $('.pdp-title').text().trim() + ' ' + $('.pdp-name').text().trim();
    const price = $('.pdp-price strong').text().trim();
    const myntraActualPrice = cleanPrice(price);

    await browser.close();

    const similarPrices = [];

    // Compare Amazon products with Myntra
    const filteredAmazonProducts = amazonProducts.filter(({ price }) => price < myntraActualPrice);
    filteredAmazonProducts.forEach(({ price: amazonPrice, link: amazonLink, title: amazonTitle }) => {
        const similarityAmazon = stringSimilarity.compareTwoStrings(myntraActualTitle, amazonTitle);
        if (similarityAmazon > 0.6) {
            similarPrices.push({
                amazonLink,
                flipkartLink: null,
                myntraPrice: Number(myntraActualPrice),
                amazonPrice,
                flipkartPrice: null,
            });
        }
    });

    // Compare Flipkart products with Myntra
    const filteredFlipkartProducts = flipkartProducts.filter(({ price }) => price < myntraActualPrice);
    filteredFlipkartProducts.forEach(({ price: flipkartPrice, link: flipkartLink, title: flipkartTitle }) => {
        const similarityFlipkart = stringSimilarity.compareTwoStrings(myntraActualTitle, flipkartTitle);
        if (similarityFlipkart > 0.6) {
            similarPrices.push({
                amazonLink: null,
                flipkartLink,
                myntraPrice: Number(myntraActualPrice),
                amazonPrice: null,
                flipkartPrice,
            });
        }
    });

    // Combine products with similarities
    filteredAmazonProducts.forEach(({ price: amazonPrice, link: amazonLink, title: amazonTitle }) => {
        filteredFlipkartProducts.forEach(({ price: flipkartPrice, link: flipkartLink, title: flipkartTitle }) => {
            const similarityFlipkart = stringSimilarity.compareTwoStrings(myntraActualTitle, flipkartTitle);
            const similarityMyntra = stringSimilarity.compareTwoStrings(myntraActualTitle, amazonTitle);

            if (similarityFlipkart > 0.6 || similarityMyntra > 0.6) {
                similarPrices.push({
                    amazonLink,
                    flipkartLink,
                    myntraPrice: myntraActualPrice,
                    amazonPrice,
                    flipkartPrice,
                });
            }
        });
    });

    res.json(similarPrices); // Return the result as JSON
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


