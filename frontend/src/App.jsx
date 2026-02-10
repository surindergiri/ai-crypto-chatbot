import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatbotPanel from './components/chatbot/ChatbotPanel';
import Documentation from './components/Documentation';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="h-[100dvh] w-screen bg-slate-50 text-slate-800 selection:bg-violet-200 selection:text-violet-900 overflow-hidden flex flex-col relative">
        <Navbar />

        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        </div>

        <div className="flex-1 w-full flex items-center justify-center p-0 md:p-4 overflow-hidden">
          <div className="w-full h-full md:max-w-5xl md:h-[85vh] z-10">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<ChatbotPanel />} />
                <Route path="/docs" element={<Documentation />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;