# AI Crypto Chatbot 🚀

A futuristic, voice-enabled AI cryptocurrency assistant that provides real-time market data, news, and network statistics. Built with a **FastAPI** backend and a **React/Vite** frontend, powered by **Google Gemini** and **Whisper**.

![Crypto Chatbpt](https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=2555&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

## ✨ Features

*   **Voice-First Interface**: Real-time Speech-to-Text (Whisper) and Text-to-Speech (offline/fast) for a seamless conversation.
*   **Live Crypto Data**: Fetches real-time prices, market cap, and volume via CoinMarketCap.
*   **Network Stats**: Queries on-chain data (blocks, fees, difficulty) for Bitcoin, Ethereum, and more via Blockchair.
*   **Trending News**: Delivers the latest crypto news summaries via CryptoPanic.
*   **Smart Agent**: Powered by Google Gemini 2.5 Flash for intelligent, context-aware responses.
*   **Futuristic UI**: Fully mobile-responsive, dark-mode "Glassmorphism" design.

## 🛠️ Tech Stack

### Backend
*   **Framework**: FastAPI (Python)
*   **AI Agent**: Google Agent Development Kit (ADK) + Gemini 2.5 Flash
*   **Voice Processing**: OpenAI Whisper (STT), pyttsx3 (TTS)
*   **Vector DB**: ChromaDB (for Knowledge Base)

### Frontend
*   **Framework**: React 19 + Vite
*   **Styling**: Tailwind CSS + Custom Animations
*   **Real-time**: WebSockets for streaming voice/text

## ⚙️ Prerequisites

*   **Node.js** (v18+)
*   **Python** (v3.10 or v3.11)
*   **FFmpeg** (Required for audio processing)
    *   *Windows*: `winget install Gyan.FFmpeg`

## 🚀 Installation & Setup

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Configuration (.env)**
Create a `.env` file in the `backend` folder with the following keys:

```env
GOOGLE_API_KEY=your_gemini_api_key
COINMARKETCAP_API_KEY=your_cmc_key
COINMARKETCAP_URL=https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest
CRYPTOPANIC_API_KEY=your_cryptopanic_key
CRYPTOPANIC_URL=https://cryptopanic.com/api/developer/v2/posts/
BLOCKCHAIR_BASE_URL=https://api.blockchair.com
BLOCKCHAIR_API_KEY=your_blockchair_key (optional)
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

## ▶️ Running the App

You need to run both the backend and frontend terminals simultaneously.

**Terminal 1: Backend**
```bash
cd backend
# Run on port 8001
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to chat!

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
