import React from 'react';
import ChatbotPanel from './components/chatbot/ChatbotPanel';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <div className="h-[100dvh] w-screen bg-deep-black text-white selection:bg-neon-blue/30 selection:text-neon-blue overflow-hidden flex items-center justify-center p-0 md:p-4">
      {/* Simple Background - distinct from complex one before */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black -z-10" />

      <div className="w-full h-full md:max-w-5xl md:h-[85vh]">
        <ErrorBoundary>
          <ChatbotPanel />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;
