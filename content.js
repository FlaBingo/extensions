// Content script that runs on all web pages to extract product information

// Product extraction patterns for different e-commerce sites
const extractionPatterns = {
  amazon: {
    title: [
      '#productTitle',
      '.product-title',
      'h1.a-size-large'
    ],
    description: [
      '#feature-bullets ul',
      '.a-unordered-list.a-vertical',
      '#productDescription p'
    ],
    price: [
      '.a-price-whole',
      '.a-offscreen',
      '.a-price .a-offscreen',
      '.a-price-symbol + .a-price-whole'
    ],
    image: [
      '#landingImage',
      '.a-dynamic-image',
      '#imgBlkFront'
    ]
  },
  flipkart: {
    title: [
      '.B_NuCI',
      'h1.yhB1nd',
      '.x2Jnpn'
    ],
    description: [
      '._1mXcCf.RmoJUa',
      '._1AN87F',
      '.IRJbnc'
    ],
    price: [
      '._30jeq3._16Jk6d',
      '._1_WHN1',
      '.CEmiEU'
    ],
    image: [
      '._396cs4._2amPTt._3qGmMb',
      '.CXW8mj',
      '._2r_T1I'
    ]
  },
  ebay: {
    title: [
      '#x-title-label-lbl',
      'h1#it-ttl',
      '.x-item-title-label h1'
    ],
    description: [
      '#desc_div',
      '.u-flL.condText',
      '#viTabs_0_is'
    ],
    price: [
      '.notranslate',
      '#prcIsum',
      '.u-flL.condText'
    ],
    image: [
      '#icImg',
      '.img640',
      '#mainImgHldr img'
    ]
  },
  walmart: {
    title: [
      'h1[data-automation-id="product-title"]',
      '.prod-ProductTitle',
      'h1.f3'
    ],
    description: [
      '.about-desc',
      '[data-testid="product-description"]',
      '.ProductPage-section'
    ],
    price: [
      '[itemprop="price"]',
      '.price-current',
      '[data-automation-id="product-price"] span'
    ],
    image: [
      '.hover-zoom-hero-image',
      '.prod-hero-image-image',
      '[data-testid="hero-image-container"] img'
    ]
  },
  generic: {
    title: [
      'h1',
      '.product-title',
      '.product-name',
      '[class*="title"]',
      '[class*="product"]'
    ],
    description: [
      '.product-description',
      '.description',
      '[class*="description"]',
      '.product-details p',
      '.product-info p'
    ],
    price: [
      '.price',
      '.product-price',
      '[class*="price"]',
      '.cost',
      '.amount'
    ],
    image: [
      '.product-image img',
      '.main-image',
      '[class*="product"] img',
      '.hero-image img',
      'img[alt*="product"]'
    ]
  }
};

// Function to determine which site we're on
function detectSite(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  
  if (hostname.includes('amazon')) return 'amazon';
  if (hostname.includes('flipkart')) return 'flipkart';
  if (hostname.includes('ebay')) return 'ebay';
  if (hostname.includes('walmart')) return 'walmart';
  
  return 'generic';
}

// Function to safely get text content from element
function getTextContent(element) {
  if (!element) return '';
  
  // Remove extra whitespace and clean up text
  return element.textContent?.replace(/\s+/g, ' ').trim() || '';
}

// Function to extract text using multiple selectors
function extractBySelectors(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = getTextContent(element);
      if (text) return text;
    }
  }
  return '';
}

// Function to extract image URL using multiple selectors
function extractImageBySelectors(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Try src, data-src, or srcset attributes
      const src = element.src || element.dataset.src || element.getAttribute('data-a-dynamic-image');
      if (src) {
        // For Amazon's dynamic images, parse JSON
        if (src.startsWith('{')) {
          try {
            const imageData = JSON.parse(src);
            const firstImageUrl = Object.keys(imageData)[0];
            if (firstImageUrl) return firstImageUrl;
          } catch (e) {
            console.log('Failed to parse image JSON:', e);
          }
        }
        return src;
      }
    }
  }
  return '';
}

// Function to clean price text
function cleanPrice(priceText) {
  if (!priceText) return '';
  
  // Extract price using regex - handles various formats like $99.99, ₹1,999, etc.
  const priceMatch = priceText.match(/[\$₹£€¥₩]?[\d,]+\.?\d*/);
  return priceMatch ? priceMatch[0] : priceText.trim();
}

// Function to clean and truncate description
function cleanDescription(description) {
  if (!description) return '';
  
  // Remove bullet points and extra formatting
  const cleaned = description
    .replace(/[•·\*]/g, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Truncate to reasonable length
  return cleaned.length > 500 ? cleaned.substring(0, 500) + '...' : cleaned;
}

// Main function to extract product data
function extractProductData() {
  const currentUrl = window.location.href;
  const site = detectSite(currentUrl);
  const patterns = extractionPatterns[site];
  
  console.log(`Extracting product data from ${site} site:`, currentUrl);
  
  // Extract data using site-specific patterns
  const title = extractBySelectors(patterns.title);
  const rawDescription = extractBySelectors(patterns.description);
  const rawPrice = extractBySelectors(patterns.price);
  const imageUrl = extractImageBySelectors(patterns.image);
  
  // Clean and format the extracted data
  const productData = {
    title: title || document.title.split('|')[0].split('-')[0].trim(),
    description: cleanDescription(rawDescription),
    price: cleanPrice(rawPrice),
    imageUrl: imageUrl ? (imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl) : '',
    link: currentUrl
  };
  
  console.log('Extracted product data:', productData);
  
  return productData;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProduct') {
    try {
      const productData = extractProductData();
      sendResponse({ success: true, data: productData });
    } catch (error) {
      console.error('Error extracting product data:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep the message channel open for async response
});

// Auto-extract when page loads (optional)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(extractProductData, 1000); // Wait for dynamic content
  });
} else {
  setTimeout(extractProductData, 1000);
}