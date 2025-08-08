
---

# 🛒 ProductSaver - Chrome Extension

ProductSaver is a Chrome Extension that lets you **grab product details** from any shopping website and send them to your ProductSaver backend with **one click**.

It’s designed to work with the ProductSaver backend (separate project).

---

## 🚀 Features
- **Login & Authentication** — Secure login with JWT via backend.
- **Auto-Fill Product Info** — Captures:
  - Title
  - Description
  - Price (currency symbols removed)
  - Product image
  - Product link
- **Manual Editing** — You can tweak data before saving.
- **One-Click Save** — Sends data to backend API.
- **Logout Support** — Clears saved token.
- **Auto URL Capture** — Automatically gets the current page link.

---

## 📂 Folder Structure


📂 product-saver-extension
├── manifest.json         # Chrome extension config
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic & API calls
├── popup.css            # Styling for popup



---

## 🔧 Installation

### 1️⃣ Load Extension in Chrome

1. Clone or download this repo.
2. Open **Chrome** → **Extensions** → **Manage Extensions**.
3. Enable **Developer Mode** (top right).
4. Click **Load Unpacked** and select the extension folder.

---

### 2️⃣ Configure Backend URL

Edit the `popup.js` file and set your backend API URL:

```javascript
const API_BASE = "https://your-backend-url.com";
````

---

## 📌 Usage

1. Click the **ProductSaver** icon in Chrome toolbar.
2. **Login** with your backend account.
3. Go to any product page (Amazon, Flipkart, etc.).
4. Click **Auto-fill** to grab product details.
5. Edit if necessary.
6. Click **Save Product** to send it to your backend.

---

## 🔒 Authentication Flow

* On login, the backend returns a **JWT token** stored in Chrome storage.
* Every save request includes the token in the **Authorization header**.
* If the token expires, you’ll be redirected to the login form.

---

## 🛠️ Tech Stack

* **HTML, CSS, JavaScript**
* **Chrome Extension APIs** (`storage`, `tabs`, `scripting`)
* **ProductSaver Backend** (Node.js + MongoDB, separate repo)

---

## 📄 License

MIT License © 2025 Satyam Prajapati