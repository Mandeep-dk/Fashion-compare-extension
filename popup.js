document.getElementById('fetch-data').addEventListener('click', async () => {
    console.log("Button clicked");

    // Get the current tab's URL using chrome.tabs.query
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        const url = tabs[0].url;
        console.log("Current Tab URL:", url);

        // Check if URL is valid (either Flipkart or Amazon)
        if (url.includes("www.amazon.in")) {
            try {
                // Send request to your backend
                const response = await fetch(`http://localhost:3000/scrape-amazon?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                console.log("Received data:", data);  // Debugging line
            
                // Populate the results in the HTML
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '';
            
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
            
                        // Append the constructed HTML
                        productDiv.innerHTML = productHtml;
                        resultsDiv.appendChild(productDiv);
                    });
            
                } else {
                    resultsDiv.innerHTML = '<p>No similar products found.</p>';
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                document.getElementById('results').innerHTML = '<p>Error fetching data.</p>';
            }
            
        } else if(url.includes("flipkart.com")){
            try {
                // Send request to your backend
                const response = await fetch(`http://localhost:3000/scrape-flipkart?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                console.log("Received data:", data);  // Debugging line
            
                // Populate the results in the HTML
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '';
            
                if (data && data.length > 0) {
                    data.forEach(product => {
                        // Myntra data
                        const myntraPrice = product.myntraPrice || null;
                        const myntraLink = product.myntraLink || null;
            
                        const productDiv = document.createElement('div');
                        productDiv.classList.add('product');
            
                        // Conditionally add Flipkart Price
                        let productHtml = '';
                        if (product.flipkartPrice) {
                            productHtml += `<p><strong>Flipkart Price:</strong> ₹${product.flipkartPrice}</p>`;
                        }
            
                        // Add Amazon Price
                        if (product.amazonPrice) {
                            productHtml += `<p><strong>Amazon Price:</strong> ₹${product.amazonPrice}</p>`;
                        }
            
                        // Conditionally add Myntra Price and Link
                        if (myntraPrice) {
                            productHtml += `<p><strong>Myntra Price:</strong> ₹${myntraPrice}</p>`;
                        }
                      
                        // Add Amazon Link
                        if (product.amazonLink) {
                            productHtml += `<p><a href="${product.amazonLink}" target="_blank">View on Amazon</a></p>`;
                        }
                        
                        if (myntraLink) {
                            productHtml += `<p><a href="${myntraLink}" target="_blank">View on Myntra</a></p>`;
                        }
            
                        productDiv.innerHTML = productHtml;
                        resultsDiv.appendChild(productDiv);
                    });
            
                } else {
                    resultsDiv.innerHTML = '<p>No similar products found.</p>';
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                document.getElementById('results').innerHTML = '<p>Error fetching data.</p>';
            }
            
        }else if(url.includes("myntra.com")) {
            try {
                // Send request to your backend
                const response = await fetch(`http://localhost:3000/scrape-myntra?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                console.log("Received data:", data);  // Debugging line
        
                // Populate the results in the HTML
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '';
        
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
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                document.getElementById('results').innerHTML = '<p>Error fetching data.</p>';
            }
        } else {
            alert("The current tab is not an Amazon, Flipkart, or Myntra URL.");
        }
        
        
    });
});
