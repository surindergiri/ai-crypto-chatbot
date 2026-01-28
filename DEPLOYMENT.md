# Deployment Guide 🚀

This project is split into a **Backend** (FastAPI + Python + FFmpeg) and a **Frontend** (React + Vite).

Because the backend requires **FFmpeg** (for voice processing), we recommend deploying it using **Docker**. The easiest free/cheap way to do this is via **Render**. The frontend can be hosted for free on **Vercel**.

---

## Part 1: Deploy Backend (Render)

1.  **Push your code to GitHub** (you should have already done this).
2.  **Sign up/Login to [Render.com](https://render.com/)**.
3.  Click **New +** and select **Web Service**.
4.  Connect your GitHub repository.
5.  **Settings**:
    *   **Root Directory**: `backend` (Important!)
    *   **Runtime**: Docker
    *   **Instance Type**: Free (or Starter if you need more RAM)
6.  **Environment Variables**:
    *   Add all the keys from your local `backend/.env` file:
        *   `GOOGLE_API_KEY`
        *   `COINMARKETCAP_API_KEY`
        *   `CRYPTOPANIC_API_KEY`
        *   `BLOCKCHAIR_API_KEY` (if used)
        *   `COINMARKETCAP_URL` (`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest`)
        *   `CRYPTOPANIC_URL` (`https://cryptopanic.com/api/developer/v2/posts/`)
        *   `BLOCKCHAIR_BASE_URL` (`https://api.blockchair.com`)
7.  Click **Create Web Service**.
8.  **Wait for deployment**. Once finished, Render will give you a public URL (e.g., `https://crypto-backend.onrender.com`). **Copy this URL.**

---

## Part 2: Deploy Frontend (Vercel)

1.  **Sign up/Login to [Vercel.com](https://vercel.com/)**.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Content Configuration**:
    *   **Framework Preset**: Vite (should detect automatically)
    *   **Root Directory**: Click `Edit` and select `frontend`.
5.  **Environment Variables**:
    *   **Name**: `VITE_WS_URL`
    *   **Value**: Your backend WebSocket URL.
        *   Take your Backend URL from Part 1.
        *   Change `https://` to `wss://` (secure websocket).
        *   Append `/ws/chat/user-session-1`.
        *   *Example*: `wss://crypto-backend.onrender.com/ws/chat/user-session-1`
6.  Click **Deploy**.

---

## 🎉 Verification

1.  Open your Vercel App URL.
2.  Typing a message should send it to your Render backend.
3.  The backend will reply (text) and generate audio (voice) which will stream back to the frontend.

## ⚠️ Notes for Free Tier

*   **Render Free Tier** spins down after inactivity. The first request might take 50+ seconds to wake up (cold start).
*   **Voice Processing** (Whisper/TTS) is CPU intensive. It might be slower on the free tier than on your local machine.
