// background.js
// Minimal service worker: we don't need complex logic here
self.addEventListener('install', () => {
  // installed
});






// // Background script (Service Worker) for the Chrome extension

// // Check if APIs are available
// const isManifestV3 = chrome.runtime.getManifest().manifest_version === 3;

// // Installation handler
// chrome.runtime.onInstalled.addListener((details) => {
//   if (details.reason === 'install') {
//     console.log('ProductSaver Extension installed successfully!');
    
//     // Set default settings
//     chrome.storage.local.set({
//       autoExtract: true,
//       notifications: true
//     });
    
//     // Create context menu
//     try {
//       chrome.contextMenus.create({
//         id: 'saveProduct',
//         title: 'Save with ProductSaver',
//         contexts: ['page', 'selection']
//       });
//     } catch (error) {
//       console.log('Context menu creation failed:', error);
//     }
//   }
// });

// // Note: chrome.action.onClicked is not needed when popup is defined in manifest
// // The popup will automatically open when the extension icon is clicked

// // Listen for tab updates to potentially extract product data
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   // Only run on complete page loads
//   if (changeInfo.status === 'complete' && tab.url) {
//     try {
//       const url = new URL(tab.url);
      
//       // Check if it's an e-commerce site
//       const ecommerceSites = [
//         'amazon.com',
//         'amazon.in',
//         'flipkart.com',
//         'ebay.com',
//         'walmart.com',
//         'target.com',
//         'bestbuy.com',
//         'etsy.com'
//       ];
      
//       const isEcommerce = ecommerceSites.some(site => url.hostname.includes(site));
      
//       if (isEcommerce) {
//         // Badge to indicate the extension is active on this page
//         chrome.action.setBadgeText({
//           text: '!',
//           tabId: tabId
//         }).catch(err => console.log('Badge text error:', err));
        
//         chrome.action.setBadgeBackgroundColor({
//           color: '#4CAF50'
//         }).catch(err => console.log('Badge color error:', err));
        
//         // Optional: Show notification
//         chrome.storage.local.get(['notifications'], (result) => {
//           if (result.notifications !== false) {
//             console.log('E-commerce site detected:', url.hostname);
//           }
//         });
//       } else {
//         // Clear badge on non-ecommerce sites
//         chrome.action.setBadgeText({
//           text: '',
//           tabId: tabId
//         }).catch(err => console.log('Clear badge error:', err));
//       }
//     } catch (error) {
//       console.log('Tab update handler error:', error);
//     }
//   }
// });

// // Handle messages from content scripts or popup
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log('Background script received message:', request);
  
//   switch (request.action) {
//     case 'saveProduct':
//       // Handle product saving logic
//       handleProductSave(request.productData)
//         .then(result => sendResponse({ success: true, data: result }))
//         .catch(error => sendResponse({ success: false, error: error.message }));
//       break;
      
//     case 'checkLogin':
//       // Check login status
//       chrome.storage.local.get(['userToken'], (result) => {
//         sendResponse({ isLoggedIn: !!result.userToken });
//       });
//       break;
      
//     case 'logout':
//       // Handle logout
//       chrome.storage.local.remove(['userToken', 'userData'], () => {
//         sendResponse({ success: true });
//       });
//       break;
      
//     default:
//       sendResponse({ success: false, error: 'Unknown action' });
//   }
  
//   return true; // Keep the message channel open for async response
// });

// // Function to handle product saving
// async function handleProductSave(productData) {
//   try {
//     // Get stored user token
//     const result = await new Promise((resolve) => {
//       chrome.storage.local.get(['userToken'], resolve);
//     });
    
//     if (!result.userToken) {
//       throw new Error('User not logged in');
//     }
    
//     // Make API call to save product
//     // Replace 'YOUR_API_ENDPOINT' with your actual API endpoint
//     const response = await fetch('https://product-store-taupe.vercel.app/api/products', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${result.userToken}`
//       },
//       body: JSON.stringify(productData)
//     });
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
    
//     const data = await response.json();
    
//     // Show success notification
//     chrome.notifications.create({
//       type: 'basic',
//       iconUrl: 'icon48.png', // You'll need to add this icon
//       title: 'ProductSaver',
//       message: 'Product saved successfully!'
//     });
    
//     return data;
//   } catch (error) {
//     console.error('Error saving product:', error);
    
//     // Show error notification
//     chrome.notifications.create({
//       type: 'basic',
//       iconUrl: 'icon48.png',
//       title: 'ProductSaver Error',
//       message: 'Failed to save product: ' + error.message
//     });
    
//     throw error;
//   }
// }

// // Context menu integration (optional)
// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === 'saveProduct') {
//     // Check if scripting API is available
//     if (chrome.scripting) {
//       chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         function: () => {
//           // Trigger product extraction
//           if (typeof chrome !== 'undefined' && chrome.runtime) {
//             chrome.runtime.sendMessage({ action: 'extractProduct' });
//           }
//         }
//       }).catch(err => console.log('Script execution error:', err));
//     } else {
//       console.log('Scripting API not available');
//     }
//   }
// });

// // temporary
// chrome.storage.onChanged.addListener((changes, areaName) => {
//   if (areaName === 'local') {
//     console.log('Storage changed:', changes);
//   }
// });
