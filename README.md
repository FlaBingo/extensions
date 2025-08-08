# ProductSaver Chrome Extension

A Chrome extension that allows users to save product details directly from e-commerce websites to your ProductSaver application.

## Features

- **Auto Product Detection**: Automatically detects product information from popular e-commerce sites
- **One-Click Save**: Save products with a single click after logging in
- **Auto URL Capture**: Automatically captures the current page URL
- **Multi-Site Support**: Works with Amazon, Flipkart, eBay, Walmart, and generic e-commerce sites
- **Smart Extraction**: Intelligently extracts product title, description, price, and images

## File Structure

```
product-saver-extension/
├── manifest.json          # Extension manifest
├── popup.html            # Main popup interface (React-based)
├── content.js            # Content script for product extraction
├── background.js         # Service worker/background script
├── icons/               # Extension icons (you need to add these)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Installation

### 1. Prepare the Extension Files

1. Create a new folder called `product-saver-extension`
2. Copy all the provided files into this folder
3. Add extension icons (16x16, 48x48, 128x128 pixels) in an `icons` folder

### 2. Update API Endpoints

Before installing, update the API endpoints in `popup.html` and `background.js`:

```javascript
// In popup.html, replace:
'YOUR_API_ENDPOINT/login'     → 'https://product-store-taupe.vercel.app/api/auth/login'
'YOUR_API_ENDPOINT/products'  → 'https://product-store-taupe.vercel.app/api/products'

// In background.js, replace:
'YOUR_API_ENDPOINT/products'  → 'https://product-store-taupe.vercel.app/api/products'
```

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select your `product-saver-extension` folder
5. The extension should now appear in your extensions list

## Usage

### 1. Login
- Click the extension icon in Chrome toolbar
- Enter your ProductSaver credentials
- Click "Login"

### 2. Save Products
- Navigate to any product page on supported sites
- Click the extension icon
- Review auto-extracted product data
- Edit if necessary
- Click "Save Product"

### 3. Supported Sites
- **Amazon** (amazon.com, amazon.in)
- **Flipkart** (flipkart.com)
- **eBay** (ebay.com)
- **Walmart** (walmart.com)
- **Generic e-commerce sites** (fallback extraction)

## API Integration

### Backend Requirements

Your ProductSaver backend needs to support these endpoints:

#### 1. Login Endpoint
```
POST /api/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

#### 2. Save Product Endpoint
```
POST /api/products
Content-Type: application/json
Authorization: Bearer jwt_token_here

Request:
{
  "title": "Product Title",
  "description": "Product description...",
  "price": "$99.99",
  "imageUrl": "https://example.com/image.jpg",
  "link": "https://amazon.com/product-page"
}

Response:
{
  "success": true,
  "product": {
    "id": 123,
    "title": "Product Title",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

## Customization

### Adding New E-commerce Sites

To add support for new sites, update the `extractionPatterns` object in `content.js`:

```javascript
const extractionPatterns = {
  // Add your new site
  yoursite: {
    title: [
      '.product-title',
      'h1.title'
    ],
    description: [
      '.product-description',
      '.desc'
    ],
    price: [
      '.price',
      '.cost'
    ],
    image: [
      '.product-image img',
      '.main-img'
    ]
  }
};
```

Then update the `detectSite` function:

```javascript
function detectSite(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  
  if (hostname.includes('yoursite')) return 'yoursite';
  // ... existing sites
}
```

### Styling Customization

The popup uses Tailwind CSS. You can customize the appearance by modifying the classes in `popup.html`.

## Permissions Explained

The extension requires these permissions:

- **activeTab**: Access the current tab to extract product data
- **storage**: Store user login information and settings
- **scripting**: Inject content scripts for data extraction
- **host_permissions**: Access all URLs to work on any e-commerce site

## Security Considerations

1. **Token Storage**: User tokens are stored in Chrome's local storage
2. **HTTPS Only**: Ensure your API endpoints use HTTPS
3. **Token Expiration**: Implement proper token expiration handling
4. **Input Validation**: Validate all extracted data before sending to API

## Troubleshooting

### Common Issues

1. **Extension not loading**
   - Check console errors in `chrome://extensions/`
   - Ensure all files are in correct locations
   - Verify manifest.json syntax

2. **Product extraction not working**
   - Check if site selectors have changed
   - Open browser console on product page
   - Look for content script errors

3. **Login failing**
   - Verify API endpoints are correct
   - Check network tab for request errors
   - Ensure CORS is configured on your backend

4. **Save product not working**
   - Check if user is logged in
   - Verify API authentication
   - Check background script console for errors

### Debug Mode

Enable debug logging by adding to `content.js`:

```javascript
const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log('[ProductSaver Extension]', ...args);
}
```

## Future Enhancements

Potential improvements you can add:

1. **Bulk Save**: Select multiple products on listing pages
2. **Price Tracking**: Monitor price changes for saved products
3. **Categories**: Auto-categorize products
4. **Wishlist Integration**: Save to different lists
5. **Social Features**: Share saved products
6. **Offline Support**: Queue saves when offline
7. **Custom Fields**: Add custom product attributes

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Compatible (same Chromium base)
- **Firefox**: Requires manifest conversion for WebExtensions
- **Safari**: Requires significant modifications

## Contributing

To contribute to this extension:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different sites
5. Submit a pull request

## License

[Add your license here]

## Support

For support or questions:
- Check the troubleshooting section
- Open an issue on GitHub
- Contact [your-email@example.com]