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
  loginMsg.textContent = "Logged Out Successfully"
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
  saveMsg.textContent = "Message";
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
    purchaseLink: linkEl.value.trim(),
  };
  if (!product.name || !product.purchaseLink || !product.price || !product.image) {
    saveMsg.textContent = "Title, Price, Image and Link are required.";
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