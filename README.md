# 💸 Cek Bukti Transfer

[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white&style=flat)](https://nodejs.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black&style=flat)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

> 🚨 This tool is intended for **educational and demonstration purposes** only. The analysis result is **not 100% accurate** and should not be used for financial decisions.

---

## 📂 Project Description

A web-based tool to analyze uploaded images of transfer receipts and predict whether they are genuine or fake using the Gemini AI API.

---

## 🚀 Deployment Options

### 🖥️ Run Locally (VPS)

1. **Clone the repo**

```bash
git clone https://github.com/MbotixTech/cek-bukti-transfer.git
cd cek-bukti-transfer
```

2. **Install dependencies**

```bash
npm install
```

3. **Create `.env` file**

```sh
GEMINI_API_KEY=your_gemini_api_key
```

4. **Run the server**

```bash
node server.js
```

5. Access via browser:

```sh
http://localhost:3000
```

---

### ☁️ Deploy on Vercel

> ✅ *Vercel is serverless. You must refactor `server.js` into an API route.*

1. Move your logic into `/api/verify.js` using `export default async function handler(req, res)` format.
2. Use `multer.memoryStorage()` instead of disk storage.
3. Upload `index.html`, `style.css`, and `script.js` into the `/public` directory.
4. Create `.env` in Vercel dashboard with:

```sh
GEMINI_API_KEY=your_gemini_api_key
```

5. Deploy from GitHub → Vercel → done.

---

## 📸 Sample Images

- `asli.png` – Example of real receipt
- `palsu.png` – Example of fake receipt

---

## ✍️ Author

**MbotixTECH**  
📫 Telegram: [@MbotixTECH](https://t.me/xiaogarpu)

---

## ⚠️ Disclaimer

This system uses AI predictions and is **not 100% reliable**. Always verify with official sources. Do not use this tool for illegal purposes.
