# Price Comparison and Coupon Finder Chrome Extension

## Overview

This Chrome extension helps users compare prices of products across multiple e-commerce platforms like **Amazon**, **Flipkart**, and **Myntra**. The extension uses **web scraping** techniques and the **string-similarity library** to find matching product titles and fetches relevant price comparisons from other websites. Additionally, it gathers available coupons and promotional codes for the website where the extension is being used.

## Features

- **Price Comparison**: The extension scrapes product data from Amazon, Flipkart, Myntra, and other popular e-commerce websites to display the best price.
- **Title Matching**: Using the string-similarity library, the extension matches the product title from the current page to the titles listed on other e-commerce sites.
- **Coupon Fetching**: Automatically fetches available coupons and promo codes for the current website or product.
- **Cross-Site Price Comparison**: Compares prices between multiple platforms to help users get the best deal.
- **User-Friendly UI**: Displays the price comparison and coupons in a simple and intuitive interface.

## How to install

1. **Clone the GitHub Repository**

- Clone the repository to your local machine:

   ```bash
   git clone https://github.com/Mandeep-dk/Fashion-compare-extension.git
   
2. **Start the Servers in VSCode**
- Start server.js using `nodemon server.js`
- Start coupon.js using `nodemon coupon.js`

3. **Load the Extension in Chrome**
- Go to `chrome://extensions/`
- Turn on **Developer mode**
- Click on **Load unpacked** and select the GitHub folder

4. **Confirmation**
- The extension will be successfully added to Chrome and can be used.

## How to Use

1. Navigate to a product page on **Amazon**, **Flipkart**, **Myntra**, or another supported e-commerce site.
2. Click on the extension icon in the browser toolbar to open the extension popup.
3. Press the **Click the button to fetch data** button within the popup.
4. Wait approximately 30 seconds for the data to load.
5. The extension will automatically scrape the product details and display a price comparison from other e-commerce platforms.
6. Coupons and promo codes for the product will also be shown if available.

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

# Example Product Pages

This Chrome Extension is designed to work perfectly on the following product pages:

1. [Link 1](https://www.flipkart.com/bata-lace-up-men/p/itm3b2932e178316?pid=SHOGJSA4K9ZXGF2D&lid=LSTSHOGJSA4K9ZXGF2DFJ5FKL&marketplace=FLIPKART&q=shoes+bata&store=osp%2Fcil&spotlightTagId=BestsellerId_osp%2Fcil&srno=s_1_4&otracker=search&otracker1=search&fm=Search&iid=d3b637a8-1028-4f89-bbaa-c9edb9100fca.SHOGJSA4K9ZXGF2D.SEARCH&ppt=sp&ppn=sp&ssid=vjao761e800000001736691611521&qH=298c7c0c76c6cdd7)

2. [Link 2](https://www.myntra.com/formal-shoes/bata/bata-men-lace-up-formal-derbys-shoes/24267522/buy)

3. [Link 3](https://www.amazon.in/FAUSTO-Formal-Office-Dress-Numeric_7/dp/B0C7L6VRJT/ref=sr_1_8?dib=eyJ2IjoiMSJ9.zjMg_HLX1T7JaMcXScZ1jf3Oa6NB6tYuIYIOf5ofzBIZ6ctv7PcfHK2CpEcIgaggDM5X-lr54QbgZPjmZm4Bo2fmaVmT5AYBIQlisrOYp3KJa3Tpz2TVL6p9VvfWeW48ZK4_UuZtekiWtBulps8STNqqNn-0r60kqwv1InnA3__c0MacVw5SS-KU_whOfOBFfZxrgzr4_SU348wvmWqvxz4vZuq4ncpsJ7QrpRLxTXtJTFVJs8p6EkILUfgl00l87GYxSa5EtI00z2kD1h5cTsMX6FpbQWjPnE6Iy-c3G4JLKAq6_xE_YQGPlVnW89HRWP8kM1jwci1JSFQd5KWOLr7INLDVVciqnDR1BFSitpPI75NVzF9Bs-22LTALxRCcuUfzTW3IlTP878TOSN-CGxSIXI08wqodM4NRnNJxbIQIeOTj-SQhQMA59YqxI1DT.JcRkctoo_IeEkDZT-BIsfwhUaf27qQVzmfI-zz55yIo&dib_tag=se&keywords=Men+Lace-Up+Formal+Derbys+Shoes&qid=1736503919&sr=8-8)
   
## Limitations

- The accuracy of price comparison may not always be precise, as it depends on the similarity threshold set in the code for matching product titles.
- The extension relies on web scraping, which can be affected by changes in the structure and layout of the e-commerce sites.
- Currently, there is noticeable latency in fetching data; optimizing the scraping process to reduce wait times is a priority.

## Future Improvements

- Adding support for additional e-commerce platforms beyond Amazon, Flipkart, and Myntra.
- Enhancing the accuracy of title matching and price comparison by integrating AI models like FashionClip or other image processing libraries for better product identification.
- Implementing real-time price tracking and notifications for added products.
- Expanding coupon fetching capabilities by sourcing from more platforms and databases.

---

If you encounter any issues or have any suggestions, feel free to open an issue or contact the project maintainer.
