// popup.js

const API_BASE = "https://product-store-taupe.vercel.app"; // <-- change this to your backend

// DOM refs
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");

const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const logoutBtn = document.getElementById("logoutBtn");

const autofillBtn = document.getElementById("autofillBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const saveMsg = document.getElementById("saveMsg");

const titleEl = document.getElementById("title");
const descEl = document.getElementById("description");
const priceEl = document.getElementById("price");
const imageEl = document.getElementById("imageUrl");
const linkEl = document.getElementById("link");

async function init() {
  const { token } = await chrome.storage.local.get(["token"]);
  if (token) showAppSection();
  else showAuthSection();
}

function showAuthSection() {
  authSection.style.display = "block";
  appSection.style.display = "none";
}

function showAppSection() {
  authSection.style.display = "none";
  appSection.style.display = "block";
}

loginBtn.addEventListener("click", async () => {
  const email = emailEl.value.trim();
  const password = passwordEl.value;
  if (!email || !password) {
    loginMsg.textContent = "Enter email & password.";
    return;
  }
  loginMsg.textContent = "Logging in...";
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.text();
      loginMsg.textContent = `Login failed: ${err}`;
      return;
    }
    const data = await res.json();
    // expect { token: "..." }
    await chrome.storage.local.set({ token: data.token });
    loginMsg.textContent = "Logged in.";
    showAppSection();
  } catch (e) {
    console.error(e);
    loginMsg.textContent = "Network error.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(["token"]);
  clearForm();
  showAuthSection();
});

clearBtn.addEventListener("click", clearForm);

function clearForm() {
  titleEl.value = "";
  descEl.value = "";
  priceEl.value = "";
  imageEl.value = "";
  linkEl.value = "";
  saveMsg.textContent = "";
}

autofillBtn.addEventListener("click", async () => {
  saveMsg.textContent = "Extracting from page...";
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !tab.id) {
      saveMsg.textContent = "No active tab.";
      return;
    }

    // executeScript runs the extractor in the page context and returns the result
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // This function runs in the page context.
        // We'll attempt multiple heuristics to find price & description.
        function bySelectors(selectors) {
          for (const s of selectors) {
            try {
              const el = document.querySelector(s);
              if (el) return el.innerText || el.textContent || el.value || null;
            } catch (e) {
              /* invalid selector */
            }
          }
          return null;
        }

        const title =
          document.querySelector('meta[property="og:title"]')?.content ||
          document.querySelector('meta[name="twitter:title"]')?.content ||
          document.title ||
          document.querySelector("h1")?.innerText ||
          "";

        const description =
          document.querySelector('meta[property="og:description"]')?.content ||
          document.querySelector('meta[name="description"]')?.content ||
          bySelectors([
            "#productDescription",
            ".product-description",
            ".description",
            ".desc",
            "#description",
          ]) ||
          "";

        // heuristics for price (common patterns)
        const priceCandidates = [
          "#priceblock_ourprice", // amazon
          "#priceblock_dealprice",
          ".price",
          ".product-price",
          ".a-price .a-offscreen",
          '[data-test="product-price"]',
          '[itemprop="price"]',
        ];
        let price = bySelectors(priceCandidates);
        // fallback: look for currency symbols on the page
        if (!price) {
          const text = document.body.innerText;
          const m = text.match(
            /₹\s?[0-9,]+(\.[0-9]{1,2})?|Rs\.?\s?[0-9,]+(\.[0-9]{1,2})?|USD\s?[0-9,.,]+|\$[0-9,]+(\.[0-9]{1,2})?/
          );
          price = m ? m[0] : "";
        }

        // image
        const image =
          document.querySelector('meta[property="og:image"]')?.content ||
          document.querySelector('meta[name="twitter:image"]')?.content ||
          document.querySelector("img#landingImage")?.src ||
          document.querySelector("img")?.src ||
          "";

        const url = location.href;

        return {
          title: title?.trim(),
          description: description?.trim(),
          price: price?.trim(),
          imageUrl: image,
          link: url,
        };
      },
    });

    // results is an array; pick first
    const payload = results?.[0]?.result;
    if (!payload) {
      saveMsg.textContent = "Could not extract product data.";
      return;
    }

    // fill the form
    titleEl.value = payload.title || "";
    descEl.value = payload.description || "";
    priceEl.value = payload.price || "";
    imageEl.value = payload.imageUrl || "";
    linkEl.value = payload.link || "";

    saveMsg.textContent = "Auto-filled from page.";
  } catch (err) {
    console.error(err);
    saveMsg.textContent = "Extraction failed. See console.";
  }
});

saveBtn.addEventListener("click", async () => {
  saveMsg.textContent = "Saving...";
  const rawPrice = priceEl.value.trim();
  const cleanedPrice = rawPrice.replace(/[₹$,]/g, "").trim();
  const product = {
    name: titleEl.value.trim(),
    description: descEl.value.trim(),
    price: cleanedPrice,
    image: imageEl.value.trim(),
    link: linkEl.value.trim(),
  };
  if (!product.name || !product.link || !product.price || !product.image) {
    saveMsg.textContent = "Title, Price, Image and link are required.";
    return;
  }

  const { token } = await chrome.storage.local.get(["token"]);
  if (!token) {
    saveMsg.textContent = "Not logged in.";
    showAuthSection();
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(product),
    });
    const data = await res.json();
    console.log(data);
    if (!res.ok) {
      const txt = await res.text();
      saveMsg.textContent = `Save failed: ${txt}`;
      return;
    }
    saveMsg.textContent = "Saved!";
  } catch (e) {
    console.error(e);
    saveMsg.textContent = "Network error saving product.";
  }
});

// init
init();

// let isLoggedIn = false;
// let user = null;

// document.addEventListener("DOMContentLoaded", () => {
//   const root = document.getElementById("root");

//   let productData = {};

//   const checkLogin = () => {
//     chrome.storage.local.get(["userToken", "userData"], (result) => {
//       if (result.userToken && result.userData) {
//         isLoggedIn = true;
//         user = result.userData;
//         getProductData(); // Only now
//       } else {
//         isLoggedIn = false;
//         user = null;
//       }
//       renderApp();
//     });
//   };

//   const getProductData = () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       const currentUrl = tabs[0].url;
//       productData.link = currentUrl;

//       chrome.tabs.sendMessage(
//         tabs[0].id,
//         { action: "extractProduct" },
//         (response) => {
//           if (response && response.success) {
//             productData = { ...productData, ...response.data };
//           }
//           renderApp();
//         }
//       );
//     });
//   };

//   const renderApp = () => {
//     root.innerHTML = "";
//     console.log(isLoggedIn);
//     if (isLoggedIn) {
//       renderLoggedInView();
//     } else {
//       renderLoginView();
//     }
//   };

//   const renderLoginView = () => {
//     root.innerHTML = `
//     <div class="p-4 bg-gray-50">
//         <div class="text-center mb-4">
//             <h1 class="text-xl font-bold text-gray-800">ProductSaver</h1>
//             <p class="text-sm text-gray-600">Login to save products</p>
//         </div>
//         <form id="loginForm" class="space-y-4">
//             <div>
//                 <input type="email" id="email" placeholder="Email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus-outline-none focus-ring-2 focus-ring-blue-500" required />
//             </div>
//             <div>
//                 <input type="password" id="password" placeholder="Password" class="w-full px-3 py-2 border border-gray-300 rounded-md focus-outline-none focus-ring-2 focus-ring-blue-500" required />
//             </div>
//             <button type="submit" id="loginBtn" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover-bg-blue-700">Login</button>
//         </form>
//         <div id="message" class="mt-4 text-sm text-center text-red-600"></div>
//     </div>
//                 `;

//     document
//       .getElementById("loginForm")
//       .addEventListener("submit", handleLogin);
//   };

//   const renderLoggedInView = () => {
//     const userName = user.name || user.email;
//     root.innerHTML = `
//                     <div class="p-4 bg-gray-50">
//                         <div class="flex justify-between items-center mb-4">
//                             <div>
//                                 <h1 class="text-lg font-bold text-gray-800">ProductSaver</h1>
//                                 <p class="text-xs text-gray-600">Welcome, ${userName}</p>
//                             </div>
//                             <button id="logoutBtn" class="text-xs text-red-600 hover-text-red-800">Logout</button>
//                         </div>
//                         <div class="space-y-3">
//                             <div>
//                                 <label class="block text-xs font-medium text-gray-700 mb-1">Title</label>
//                                 <input type="text" id="productTitle"  value="${
//                                   productData.title || ""
//                                 }" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus-outline-none focus-ring-2 focus-ring-blue-500" placeholder="Product title" required/>
//                             </div>
//                             <div>
//                                 <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
//                                 <textarea id="productDescription" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus-outline-none focus-ring-2 focus-ring-blue-500" rows="3" placeholder="Product description">${
//                                   productData.description || ""
//                                 }</textarea>
//                             </div>
//                             <div>
//                                 <label class="block text-xs font-medium text-gray-700 mb-1">Price</label>
//                                 <input type="text" id="productPrice" value="${
//                                   productData.price || ""
//                                 }" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus-outline-none focus-ring-2 focus-ring-blue-500" placeholder="$99.99" required/>
//                             </div>
//                             <div>
//                                 <label class="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
//                                 <input type="url" id="productImage" value="${
//                                   productData.imageUrl || ""
//                                 }" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus-outline-none focus-ring-2 focus-ring-blue-500" placeholder="https://example.com/image.jpg" required/>
//                             </div>
//                             <div>
//                                 <label class="block text-xs font-medium text-gray-700 mb-1">Product Link</label>
//                                 <input type="url" id="productLink" value="${
//                                   productData.link || ""
//                                 }" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus-outline-none focus-ring-2 focus-ring-blue-500" placeholder="https://amazon.com/product" required/>
//                             </div>
//                             <button id="saveProductBtn" class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover-bg-green-700 text-sm">Save Product</button>
//                             <div id="message" class="text-xs text-center text-green-600 mt-2"></div>
//                         </div>
//                     </div>
//                 `;

//     document
//       .getElementById("logoutBtn")
//       .addEventListener("click", handleLogout);
//     document
//       .getElementById("saveProductBtn")
//       .addEventListener("click", handleSaveProduct);

//     // Add event listeners for input changes to update productData
//     document
//       .getElementById("productTitle")
//       .addEventListener("input", (e) => (productData.title = e.target.value));
//     document
//       .getElementById("productDescription")
//       .addEventListener(
//         "input",
//         (e) => (productData.description = e.target.value)
//       );
//     document
//       .getElementById("productPrice")
//       .addEventListener("input", (e) => (productData.price = e.target.value));
//     document
//       .getElementById("productImage")
//       .addEventListener(
//         "input",
//         (e) => (productData.imageUrl = e.target.value)
//       );
//     document
//       .getElementById("productLink")
//       .addEventListener("input", (e) => (productData.link = e.target.value));
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     const loginBtn = document.getElementById("loginBtn");
//     const messageDiv = document.getElementById("message");
//     const email = document.getElementById("email").value;
//     const password = document.getElementById("password").value;
//     // console.log(email, password);
//     loginBtn.disabled = true;
//     loginBtn.textContent = "Logging in...";
//     messageDiv.textContent = "";
//     messageDiv.className = "mt-4 text-sm text-center text-red-600";

//     try {
//       const response = await fetch(
//         "https://product-store-taupe.vercel.app/api/auth/login",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ email, password }),
//         }
//       );

//       const data = await response.json();
//       // console.log(data);
//       if (response.ok) {
//         // chrome.storage.local.set(
//         //   {
//         //     userToken: data.token,
//         //     userData: data.user,
//         //   },
//         //   () => {
//         //     // Add error checking here
//         //     if (chrome.runtime.lastError) {
//         //       console.error("Storage error:", chrome.runtime.lastError);
//         //       messageDiv.textContent = "Failed to save login data";
//         //       return;
//         //     }
//         //     isLoggedIn = true;
//         //     user = data.user;
//         //     renderApp();
//         //     messageDiv.textContent = "Login successful!";
//         //     messageDiv.className = "mt-4 text-sm text-center text-green-600";
//         //   }
//         // );
//         await new Promise((resolve, reject) => {
//           chrome.storage.local.set(
//             { userToken: data.token, userData: data.user },
//             () => {
//               if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
//               else resolve();
//             }
//           );
//         });
//         isLoggedIn = true;
//         user = data.user;
//         renderApp();
//         messageDiv.textContent = "Login successful!";
//         messageDiv.className = "mt-4 text-sm text-center text-green-600";
//       } else {
//         messageDiv.textContent = data.message || "Login failed";
//       }
//     } catch (error) {
//       messageDiv.textContent = "Network error. Please try again.";
//       console.error("Login error:", error);
//     }

//     loginBtn.disabled = false;
//     loginBtn.textContent = "Login";
//   };

//   const handleLogout = () => {
//     chrome.storage.local.remove(["userToken", "userData"], () => {
//       isLoggedIn = false;
//       user = null;
//       renderApp();
//       // Set a message on the login view
//       const messageDiv = document.getElementById("message");
//       if (messageDiv) {
//         messageDiv.textContent = "Logged out successfully!";
//         messageDiv.className = "mt-4 text-sm text-center text-green-600";
//       }
//     });
//   };

//   const handleSaveProduct = async () => {
//     const saveBtn = document.getElementById("saveProductBtn");
//     const messageDiv = document.getElementById("message");

//     saveBtn.disabled = true;
//     saveBtn.textContent = "Saving...";
//     messageDiv.textContent = "";
//     messageDiv.className = "text-xs text-center text-green-600 mt-2";

//     try {
//       const result = await new Promise((resolve) => {
//         chrome.storage.local.get(["userToken"], resolve);
//       });
//       const token = result.userToken;

//       if (!token) {
//         messageDiv.textContent = "Error: Not authenticated.";
//         saveBtn.disabled = false;
//         saveBtn.textContent = "Save Product";
//         return;
//       }

//       const response = await fetch(
//         "https://product-store-taupe.vercel.app/api/products",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(productData),
//         }
//       );

//       if (response.ok) {
//         messageDiv.textContent = "Product saved successfully!";
//         // Reset product data after saving
//         productData = {
//           title: "",
//           description: "",
//           price: "",
//           imageUrl: "",
//           link: "",
//         };
//         // Re-render to clear the form
//         renderApp();
//       } else {
//         const data = await response.json();
//         messageDiv.textContent = data.message || "Failed to save product";
//         messageDiv.className = "text-xs text-center text-red-600 mt-2";
//       }
//     } catch (error) {
//       messageDiv.textContent = "Network error. Please try again.";
//       messageDiv.className = "text-xs text-center text-red-600 mt-2";
//       console.error("Save product error:", error);
//     }

//     saveBtn.disabled = false;
//     saveBtn.textContent = "Save Product";
//   };

//   checkLogin();
//   // getProductData();
// });
