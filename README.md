# Price Comparison and Coupon Finder Chrome Extension

## Overview

This Chrome extension helps users compare prices of products across multiple e-commerce platforms like **Amazon**, **Flipkart**, and **Myntra**. The extension uses **web scraping** techniques and the **string-similarity library** to find matching product titles and fetches relevant price comparisons from other websites. Additionally, it gathers available coupons and promotional codes for the website where the extension is being used.

## Features

- **Price Comparison**: The extension scrapes product data from Amazon, Flipkart, Myntra, and other popular e-commerce websites to display the best price.
- **Title Matching**: Using the string-similarity library, the extension matches the product title from the current page to the titles listed on other e-commerce sites.
- **Coupon Fetching**: Automatically fetches available coupons and promo codes for the current website or product.
- **Cross-Site Price Comparison**: Compares prices between multiple platforms to help users get the best deal.
- **User-Friendly UI**: Displays the price comparison and coupons in a simple and intuitive interface.

## How to Use

1. Navigate to a product page on **Amazon**, **Flipkart**, **Myntra**, or another supported e-commerce site.
2. Click on the extension icon in the browser toolbar to open the extension popup.
3. Press the **Click the button to fetch data** button within the popup.
4. The extension will automatically scrape the product details and display a price comparison from other e-commerce platforms.
5. Coupons and promo codes for the product will also be shown if available.


## Technologies Used

- **JavaScript**: Core logic and scraping functionality.
- **Express.js**: Backend server to handle requests and serve scraped data.
- **Puppeteer**: For headless browser automation to scrape product data from e-commerce websites.
- **Cheerio**: For parsing and extracting data from the HTML of scraped pages.
- **string-similarity**: For matching product titles across different platforms.
- **HTML/CSS**: Front-end interface for the extension popup.


## How It Works

1. The extension scrapes the title of the product from the currently open page.
2. It uses the **string-similarity** library to match the title with similar products listed on Amazon, Flipkart, Myntra, and other supported e-commerce websites.
3. The extension then fetches and compares the prices of the matching products.
4. It also checks for any available coupons or promotional codes on the current website and displays them to the user.

## Limitations

- The accuracy of price comparison may not always be precise, as it depends on the similarity threshold set in the code for matching product titles.
- The extension relies on web scraping, which can be affected by changes in the structure and layout of the e-commerce sites.


## Future Improvements

- Adding support for additional e-commerce platforms beyond Amazon, Flipkart, and Myntra.
- Enhancing the accuracy of title matching and price comparison by integrating AI models like FashionClip or other image processing libraries for better product identification.
- Implementing real-time price tracking and notifications for added products.
- Expanding coupon fetching capabilities by sourcing from more platforms and databases.

---

If you encounter any issues or have any suggestions, feel free to open an issue or contact the project maintainer.
