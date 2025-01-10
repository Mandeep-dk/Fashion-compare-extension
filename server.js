// server.js (Backend)
const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const stringSimilarity = require('string-similarity');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());

const cleanPrice = (priceString) => {
    const cleanedPrice = priceString.replace(/[^\d.]/g, '').trim();  // Remove non-numeric characters
    return parseFloat(cleanedPrice);
};

// Price similarity logic update
const comparePrices = (price1, price2) => {
    const cleanedPrice1 = cleanPrice(price1);
    const cleanedPrice2 = cleanPrice(price2);

    if (!isNaN(cleanedPrice1) && !isNaN(cleanedPrice2)) {
        // Calculate absolute difference to handle small discrepancies
        const priceDifference = Math.abs(cleanedPrice1 - cleanedPrice2);
        const averagePrice = (cleanedPrice1 + cleanedPrice2) / 2;

        // Calculate the similarity score
        const similarityScore = 1 - (priceDifference / averagePrice);

        // Adjust the threshold based on your needs (e.g., only accept similarity > 0.90)
        return similarityScore > 0.90 ? similarityScore : 0;  // Only return similarity if it's above 90%
    }
    return 0;  // Return 0 if one of the prices is not valid
};

// Scrape Amazon
app.get('/scrape-amazon', async (req, res) => {
    const { url } = req.query;
    // console.log('Scraping Amazon URL:', url);

    const regex = /\/dp\/[^/]+\/.*?keywords=([^&]*)/;
    const match = url.match(regex);

    let productNameFromUrl = '';
    if (match && match[1]) {
        productNameFromUrl = decodeURIComponent(match[1]).replace(/\+/g, ' ');
    } else {
        console.log('Product name not found');
    }
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

    const amazonPrice = [];
    amazon('.a-price').each((index, element) => {
        const price = amazon(element).find('.a-price-whole').text().trim();
        if (price) {
            const cleanedPrice = cleanPrice(price);
            if (!isNaN(cleanedPrice) && cleanedPrice > 100) {  // Only consider prices above 100
                amazonPrice.push(cleanedPrice);
            }
        }
    });

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-extensions']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const content = await page.content();
    const $ = cheerio.load(content);

    const amazonActualTitle = $('#productTitle').text().trim() || 'Title not found';
    const amazonActualPrice = $('.a-price-whole').first().text().trim() || 'Price not found';

    console.log("Amazon product title: ", amazonActualTitle);
    console.log("Amazon product price: ", amazonActualPrice);
    // const cleanedAmazonPrice = cleanPrice(price);

    await browser.close();

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

    const myntraUrl = `https://www.myntra.com/${encodeURIComponent(productNameFromUrl)}`;
    await page1.goto(myntraUrl, { waitUntil: 'domcontentloaded' });

    // Wait for the product links to load
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
        return products; // Return the products array
    });

    // const cleanedMyntraProducts = myntraProducts.map(product => ({
    //     ...product,
    //     price: parseInt(product.price.replace(/[^\d]/g, ''), 10) // Apply cleanPrice here
    // }));
    const browser2 = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page2 = await browser2.newPage();

    // Set a user-agent to mimic a real browser
    await page2.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Construct the Flipkart search URL
    const flipkartSearchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(productNameFromUrl)}`;

    // Navigate to the Flipkart search page
    await page2.goto(flipkartSearchUrl, { waitUntil: 'networkidle2' });

    // Extract the HTML content of the page
    const flipkartHtml = await page2.content();

    // Load Cheerio to parse the HTML
    const flipkart = cheerio.load(flipkartHtml);

    const flipkartProducts = [];

    flipkart('a[target="_blank"]').each((index, element) => {
        const productElement = flipkart(element);
        const productLink = productElement.attr('href');

        const regex = /\/([^\/]+)\/p\//; // Matches the part after '/' and before '/p/'
        const match = productLink.match(regex);

        let productNameFromUrl = '';
        if (match && match[1]) {
            productNameFromUrl = decodeURIComponent(match[1]).replace(/\+/g, ' ');
        } else {
            console.log('Product name not found');
        }

        const fullLink = `https://www.flipkart.com${productLink}`;

        // Dynamically find the price (target elements containing price)
        const priceText = productElement.find('.Nx9bqj').text().trim(); // Use multiple selectors to handle dynamic class names

        // console.log(`Product Link: ${productLink}, Price Text: ${priceText}, Title: ${productNameFromUrl}`);

        if (productLink && priceText && productNameFromUrl) {
            flipkartProducts.push({
                link: fullLink,
                price: cleanPrice(priceText),
                title: productNameFromUrl
            });
        }
    });

    await browser1.close();
    // console.log("Myntra", myntraProducts);
    // console.log("Flipkart", flipkartProducts);

    const similarPrices = [];

    // Filter Myntra products with price less than Amazon price
    const filteredMyntraProducts = myntraProducts.filter(({ price }) => price < Number(amazonActualPrice));
    console.log(filteredMyntraProducts)
    // Filter Flipkart products with price less than Amazon price
    const filteredFlipkartProducts = flipkartProducts.filter(({ price }) => price < Number(amazonActualPrice));
    console.log(filteredFlipkartProducts);

    // Add filtered Myntra products to similarPrices
    filteredMyntraProducts.forEach(({ price: myntraPrice, link: myntraLink, title: myntraTitle }) => {
        const similarityMyntra = stringSimilarity.compareTwoStrings(amazonActualTitle, myntraTitle);
        console.log("Myntra similarity", similarityMyntra);
        if (similarityMyntra > 0.3) {
            similarPrices.push({
                myntraLink,
                flipkartLink: null, // No matching Flipkart product
                amazonPrice: Number(amazonActualPrice),
                myntraPrice,
                flipkartPrice: null,
            });
        }
    });

    // Add filtered Flipkart products to similarPrices
    filteredFlipkartProducts.forEach(({ price: flipkartPrice, link: flipkartLink, title: flipkartTitle }) => {
        const similarityFlipkart = stringSimilarity.compareTwoStrings(amazonActualTitle, flipkartTitle);
        console.log("Flipkart similarity", similarityFlipkart);

        if (similarityFlipkart > 0.3) {
            similarPrices.push({
                myntraLink: null, // No matching Myntra product
                flipkartLink,
                amazonPrice: Number(amazonActualPrice),
                myntraPrice: null,
                flipkartPrice,
            });
        }
    });

    // Combine products where both Myntra and Flipkart meet the conditions
    filteredMyntraProducts.forEach(({ price: myntraPrice, link: myntraLink, title: myntraTitle }) => {
        filteredFlipkartProducts.forEach(({ price: flipkartPrice, link: flipkartLink, title: flipkartTitle }) => {
            const similarityFlipkart = stringSimilarity.compareTwoStrings(amazonActualTitle, flipkartTitle);
            const similarityMyntra = stringSimilarity.compareTwoStrings(amazonActualTitle, myntraTitle);
            console.log("Myntra Title:", myntraTitle, "Similarity:", similarityMyntra);
            console.log("Flipkart Title:", flipkartTitle, "Similarity:", similarityFlipkart);

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

    console.log("Similar Prices with links:", similarPrices);
    res.json(similarPrices);
});

app.get('/scrape-flipkart', async (req, res) => {
    const { url } = req.query;

    const regex = /flipkart\.com\/([^\/]+)\/p\//;
    const match = url.match(regex);

    let productNameFromUrl = '';
    if (match && match[1]) {
        productNameFromUrl = decodeURIComponent(match[1]).replace(/\+/g, ' ');
    } else {
        console.log('Product name not found');
    }

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

    // Fetch Flipkart product data
    const flipkartUrl = await fetch(`https://www.flipkart.com/search?q=${encodeURIComponent(productNameFromUrl)}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }
    });
    console.log(productNameFromUrl);
    const flipkartHtml = await flipkartUrl.text();
    const flipkart = cheerio.load(flipkartHtml);

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

    const myntraUrl = `https://www.myntra.com/${encodeURIComponent(productNameFromUrl)}`;
    await page1.goto(myntraUrl, { waitUntil: 'domcontentloaded' });

    // Wait for the product links to load
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
        return products; // Return the products array
    });


    await browser1.close();

    // Extract product title and price from Flipkart page using Puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-extensions']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const content = await page.content();
    const $ = cheerio.load(content);

    const flipkartActualTitle = $('.VU-ZEz').text().trim() || 'Title not found';
    const price = $('.Nx9bqj.CxhGGd').text().trim() || 'Price not found';
    const flipkartActualPrice = cleanPrice(price);
    
    console.log("Flipkart product title: ", flipkartActualTitle);
    console.log("Flipkart product price: ", flipkartActualPrice);

    await browser.close();

    const similarPrices = [];

    // Filter Myntra products with price less than Amazon price
    const filteredAmazonProducts = amazonProducts.filter(({ price }) => price < flipkartActualPrice);
    console.log(filteredAmazonProducts)
    // console.log(myntraProducts)
    const filteredMyntraProducts = myntraProducts.filter(({ price }) => price < flipkartActualPrice);
    console.log(filteredMyntraProducts)

    // Add filtered Myntra products to similarPrices
    filteredAmazonProducts.forEach(({ price: amazonPrice, link: amazonLink, title: amazonTitle }) => {
        const similarityAmazon = stringSimilarity.compareTwoStrings(flipkartActualTitle, amazonTitle);
        if (similarityAmazon > 0.3) {
            similarPrices.push({
                amazonLink,
                myntraLink: null, 
                amazonPrice: amazonPrice,
                amazonPrice,
                flipkartPrice: flipkartActualPrice,
            });
        }
    });

    // Add filtered Flipkart products to similarPrices
    filteredMyntraProducts.forEach(({ price: myntraPrice, link: myntraLink, title: myntraTitle }) => {
        const similarityMyntra = stringSimilarity.compareTwoStrings(flipkartActualTitle, myntraTitle);

        if (similarityMyntra > 0.3) {
            similarPrices.push({
                amazonLink: null, // No matching Myntra product
                myntraLink,
                flipkartPrice: flipkartActualPrice,
                amazonPrice: null,
                myntraPrice,
            });
        }
    });

    // Combine products where both Myntra and Flipkart meet the conditions
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

    console.log("Similar Prices with links:", similarPrices);
    res.json(similarPrices);
});


app.get('/scrape-myntra', async (req, res) => {
    const { url } = req.query;
    console.log('Scraping Myntra URL:', url);

    const regex = /myntra\.com\/[^\/]+\/[^\/]+\/([^\/]+)\//;
    const match = url.match(regex);

    let productNameFromUrl = '';
    if (match && match[1]) {
        productNameFromUrl = decodeURIComponent(match[1]).replace(/\+/g, ' ');
    } else {
        console.log('Product name not found');
    }

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

    const browser2 = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page2 = await browser2.newPage();

    // Set a user-agent to mimic a real browser
    await page2.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Construct the Flipkart search URL
    const flipkartSearchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(productNameFromUrl)}`;

    // Navigate to the Flipkart search page
    await page2.goto(flipkartSearchUrl, { waitUntil: 'networkidle2' });

    // Extract the HTML content of the page
    const flipkartHtml = await page2.content();

    // Load Cheerio to parse the HTML
    const flipkart = cheerio.load(flipkartHtml);

    const flipkartProducts = [];

    flipkart('a[target="_blank"]').each((index, element) => {
        const productElement = flipkart(element);
        const productLink = productElement.attr('href');

        const regex = /\/([^\/]+)\/p\//; // Matches the part after '/' and before '/p/'
        const match = productLink.match(regex);

        let productNameFromUrl = '';
        if (match && match[1]) {
            productNameFromUrl = decodeURIComponent(match[1]).replace(/\+/g, ' ');
        } else {
            console.log('Product name not found');
        }

        const fullLink = `https://www.flipkart.com${productLink}`;

        // Dynamically find the price (target elements containing price)
        const priceText = productElement.find('.Nx9bqj').text().trim(); // Use multiple selectors to handle dynamic class names

        // console.log(`Product Link: ${productLink}, Price Text: ${priceText}, Title: ${productNameFromUrl}`);

        if (productLink && priceText && productNameFromUrl) {
            flipkartProducts.push({
                link: fullLink,
                price: cleanPrice(priceText),
                title: productNameFromUrl
            });
        }
    });

    await browser2.close();
    // console.log("Myntra", myntraProducts);
    // console.log("Flipkart", flipkartProducts);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-extensions', '--disable-setuid-sandbox',  '--disable-http2' // Disable HTTP2
    ]
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const content = await page.content();
    const $ = cheerio.load(content);

    // Extract the product title
    const myntraActualTitle = $('.pdp-title').text().trim() + ' ' + $('.pdp-name').text().trim();

    // Extract the product price
    const price = $('.pdp-price strong').text().trim();
    const myntraActualPrice = cleanPrice(price)

    console.log("Myntra product title: ", myntraActualTitle);
    console.log("Myntra product price: ", myntraActualPrice);

    await browser.close();
    const similarPrices = [];

    // Filter Myntra products with price less than Amazon price
    const filteredAmazonProducts = amazonProducts.filter(({ price }) => price < myntraActualPrice);
    console.log(filteredAmazonProducts)
    // Filter Flipkart products with price less than Amazon price
    const filteredFlipkartProducts = flipkartProducts.filter(({ price }) => price < myntraActualPrice);
    console.log(filteredFlipkartProducts);

    // Add filtered Myntra products to similarPrices
    filteredAmazonProducts.forEach(({ price: amazonPrice, link: amazonLink, title: amazonTitle }) => {
        const similarityAmazon = stringSimilarity.compareTwoStrings(myntraActualTitle, amazonTitle);
        console.log("Amazon similarity", similarityAmazon);
        if (similarityAmazon > 0.6) {
            similarPrices.push({
                amazonLink,
                flipkartLink: null, // No matching Flipkart product
                myntraPrice: Number(myntraActualPrice),
                amazonPrice,
                flipkartPrice: null,
            });
        }
    });

    // Add filtered Flipkart products to similarPrices
    filteredFlipkartProducts.forEach(({ price: flipkartPrice, link: flipkartLink, title: flipkartTitle }) => {
        const similarityFlipkart = stringSimilarity.compareTwoStrings(price, flipkartTitle);
        console.log("Flipkart similarity", similarityFlipkart);

        if (similarityFlipkart > 0.6) {
            similarPrices.push({
                amazonLink: null, // No matching Myntra product
                flipkartLink,
                myntraPrice: Number(myntraActualPrice),
                amazonPrice: null,
                flipkartPrice,
            });
        }
    });

    // Combine products where both Myntra and Flipkart meet the conditions
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

    console.log("Similar Prices with links:", similarPrices);
    res.json(similarPrices);

});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


