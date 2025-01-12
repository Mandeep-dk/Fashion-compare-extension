document.getElementById('fetch-data').addEventListener('click', async () => {
    const loadingIndicator = document.getElementById('loading');
    loadingIndicator.style.display = 'block';
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        const url = tabs[0].url;
        console.log("Current Tab URL:", url);

        if (url.includes("www.amazon.in")) {
            loadingIndicator.style.display = 'none';
            try {
                loadingIndicator.style.display = 'block';
                const response = await fetch(`http://localhost:3000/scrape-amazon?url=${encodeURIComponent(url)}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch product data: ${response.statusText}`);
                }
                const couponsResponse = await fetch(`http://localhost:5000/coupon-amazon`);
                const couponData = await couponsResponse.json(); // Coupons data
                const data = await response.json(); // Product data
                loadingIndicator.style.display = 'none';

                console.log("Received data:", data); // Debugging line
                console.log("Received coupon data:", couponData); // Debugging line for coupons

                // Populate the results in the HTML
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '';  // Clear the results div

                // Display coupons if available
                if (couponData && couponData.length > 0) {
                    let couponsHtml = `<h4>Available Coupons:</h4><ul>`;
                    couponData.forEach(coupon => {
                        // Ensure coupon has both title and code before displaying
                        if (coupon.title && coupon.code) {
                            couponsHtml += `<li>${coupon.title}: <strong>${coupon.code}</strong></li>`;
                        }
                    });
                    couponsHtml += `</ul>`;

                    const couponDiv = document.createElement('div');
                    couponDiv.classList.add('coupons');
                    couponDiv.innerHTML = couponsHtml;
                    resultsDiv.appendChild(couponDiv);  // Append coupons to the DOM
                } else {
                    // If no coupons are available
                    resultsDiv.innerHTML += '<p>No available coupons.</p>';
                    loadingIndicator.style.display = 'none';  // Hide loading indicator if invalid URL

                }


                // Display product data
                if (data && data.length > 0) {
                    data.forEach(product => {
                        const productDiv = document.createElement('div');
                        productDiv.classList.add('product');

                        let productHtml = `<p><strong>Amazon Price:</strong> ₹${product.amazonPrice}</p>`;

                        // Only show Flipkart Price and Link if they exist
                        if (product.flipkartPrice) {
                            productHtml += `<p><strong>Flipkart Price:</strong> ₹${product.flipkartPrice}</p>`;
                        }

                        // Only show Myntra Price and Link if they exist
                        if (product.myntraPrice) {
                            productHtml += `<p><strong>Myntra Price:</strong> ₹${product.myntraPrice}</p>`;
                        }
                        if (product.flipkartLink) {
                            productHtml += `<p><a href="${product.flipkartLink}" target="_blank">View on Flipkart</a></p>`;
                        }

                        if (product.myntraLink) {
                            productHtml += `<p><a href="${product.myntraLink}" target="_blank">View on Myntra</a></p>`;
                        }

                        productDiv.innerHTML = productHtml;
                        resultsDiv.appendChild(productDiv);
                    });
                } else {
                    resultsDiv.innerHTML = '<p>No similar products found.</p>';
                    loadingIndicator.style.display = 'none';  // Hide loading indicator if invalid URL

                }
            } catch (error) {
                console.error("Error fetching data:", error);
                document.getElementById('results').innerHTML = '<p>Error fetching data.</p>';
                loadingIndicator.style.display = 'none';  // Hide loading indicator if invalid URL

            }

        } else if (url.includes("flipkart.com")) {
            try {
                loadingIndicator.style.display = 'block';
                // Send request to your backend for both product and coupon data
                const response = await fetch(`http://localhost:3000/scrape-flipkart?url=${encodeURIComponent(url)}`);
                const couponsResponse = await fetch(`http://localhost:5000/coupon-flipkart`);

                const data = await response.json();  // Product data
                loadingIndicator.style.display = 'none';
                const couponData = await couponsResponse.json();  // Coupons data

                console.log("Received data:", data);  // Debugging line for product data
                console.log("Received coupon data:", couponData);  // Debugging line for coupons

                // Populate the results in the HTML
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '';  // Clear the results div

                // Display coupons if available
                if (couponData && couponData.length > 0) {
                    let couponsHtml = `<h4>Available Coupons:</h4><ul>`;
                    couponData.forEach(coupon => {
                        // Ensure coupon has both title and code before displaying
                        if (coupon.title && coupon.code) {
                            couponsHtml += `<li>${coupon.title}: <strong>${coupon.code}</strong></li>`;
                        }
                    });
                    couponsHtml += `</ul>`;

                    const couponDiv = document.createElement('div');
                    couponDiv.classList.add('coupons');
                    couponDiv.innerHTML = couponsHtml;
                    resultsDiv.appendChild(couponDiv);  // Append coupons to the DOM
                } else {
                    // If no coupons are available
                    resultsDiv.innerHTML += '<p>No available coupons.</p>';
                    loadingIndicator.style.display = 'none';  // Hide loading indicator if invalid URL

                }

                // Display product data if available
                if (data && data.length > 0) {
                    data.forEach(product => {
                        const productDiv = document.createElement('div');
                        productDiv.classList.add('product');
                        let productHtml = '';

                        // Conditionally add Flipkart Price, Amazon Price, and Myntra Price and Links
                        if (product.flipkartPrice) {
                            productHtml += `<p><strong>Flipkart Price:</strong> ₹${product.flipkartPrice}</p>`;
                        }
                        if (product.amazonPrice) {
                            productHtml += `<p><strong>Amazon Price:</strong> ₹${product.amazonPrice}</p>`;
                        }
                        if (product.myntraPrice) {
                            productHtml += `<p><strong>Myntra Price:</strong> ₹${product.myntraPrice}</p>`;
                        }
                        if (product.amazonLink) {
                            productHtml += `<p><a href="${product.amazonLink}" target="_blank">View on Amazon</a></p>`;
                        }
                        if (product.myntraLink) {
                            productHtml += `<p><a href="${product.myntraLink}" target="_blank">View on Myntra</a></p>`;
                        }

                        productDiv.innerHTML = productHtml;
                        resultsDiv.appendChild(productDiv);  // Append product info to the DOM
                    });
                } else {
                    resultsDiv.innerHTML += '<p>No similar products found.</p>';
                    loadingIndicator.style.display = 'none';  // Hide loading indicator if invalid URL

                }

            } catch (error) {
                console.error("Error fetching data:", error);
                document.getElementById('results').innerHTML = '<p>Error fetching data.</p>';
                loadingIndicator.style.display = 'none';  // Hide loading indicator if invalid URL

            }


        } else if (url.includes("myntra.com")) {
            try {
                loadingIndicator.style.display = 'block';
                const response = await fetch(`http://localhost:3000/scrape-myntra?url=${encodeURIComponent(url)}`);
                const couponsResponse = await fetch(`http://localhost:5000/coupon-myntra`);

                const data = await response.json();  // Product data
                loadingIndicator.style.display = 'none';

                const couponData = await couponsResponse.json();  // Coupons data

                console.log("Received data:", data);  // Debugging line
                console.log("Received coupon data:", couponData);  // Debugging line for coupons

                // Populate the results in the HTML
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '';

                if (couponData && couponData.length > 0) {
                    let couponsHtml = `<h4>Available Coupons:</h4><ul>`;
                    couponData.forEach(coupon => {
                        couponsHtml += `<li>${coupon.title}: <strong>${coupon.code}</strong></li>`; // Display coupon title and code together
                    });
                    couponsHtml += `</ul>`;

                    const couponDiv = document.createElement('div');
                    couponDiv.classList.add('coupons');
                    couponDiv.innerHTML = couponsHtml;

                    resultsDiv.appendChild(couponDiv);
                } else {
                    // If no coupons are available
                    resultsDiv.innerHTML += '<p>No available coupons.</p>';
                    loadingIndicator.style.display = 'none';  // Hide loading indicator if invalid URL

                }



                if (data && data.length > 0) {
                    data.forEach(product => {
                        // Flipkart data
                        const flipkartPrice = product.flipkartPrice || null;
                        const flipkartLink = product.flipkartLink || null;

                        const productDiv = document.createElement('div');
                        productDiv.classList.add('product');

                        // Add Myntra Price
                        let productHtml = `<p><strong>Myntra Price:</strong> ₹${product.myntraPrice}</p>`;

                        // Add Amazon Price
                        productHtml += `<p><strong>Amazon Price:</strong> ₹${product.amazonPrice}</p>`;

                        // Conditionally add Flipkart Price and Link
                        if (flipkartPrice) {
                            productHtml += `<p><strong>Flipkart Price:</strong> ₹${flipkartPrice}</p>`;
                        }
                        if (flipkartLink) {
                            productHtml += `<p><a href="${flipkartLink}" target="_blank">View on Flipkart</a></p>`;
                        }

                        // Add Amazon Link
                        productHtml += `<p><a href="${product.amazonLink}" target="_blank">View on Amazon</a></p>`;

                        productDiv.innerHTML = productHtml;
                        resultsDiv.appendChild(productDiv);
                    });

                } else {
                    resultsDiv.innerHTML = '<p>No similar products found.</p>';
                    loadingIndicator.style.display = 'none';  // Hide loading indicator if invalid URL

                }
            } catch (error) {
                console.error("Error fetching data:", error);
                document.getElementById('results').innerHTML = '<p>Error fetching data.</p>';
                loadingIndicator.style.display = 'none';  // Hide loading indicator if invalid URL

            }
        } else {
            alert("The current tab is not an Amazon, Flipkart, or Myntra URL.");
            loadingIndicator.style.display = 'none';  // Hide loading indicator if invalid URL

        }
    });
});
