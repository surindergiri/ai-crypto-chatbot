import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';

const ChatbotPanel = () => {
    // Removed isOpen state as it's now always visible/static
    const [isListening, setIsListening] = useState(false);

    const {
        isConnected,
        messages,
        setMessages,
        isTyping,
        sendAudioChunk,
        sendTranscribeRequest,
        stopAudio,
        sendMessage,
        currentTranscript
    } = useChatWebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8001/ws/chat/user-session-1');

    // Add initial greeting if empty
    React.useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ id: 1, text: "Hello! I'm your crypto AI assistant. How can I help you today?", isUser: false }]);
        }
    }, [messages.length, setMessages]);

    const handleSendMessage = (text) => {
        stopAudio(); // Stop any ongoing speech when user sends a new message
        sendMessage(text);
    };

    const handleAudioChunk = (blob) => {
        sendAudioChunk(blob);
    };

    const handleRecordingStop = () => {
        setIsListening(false);
        sendTranscribeRequest();
    };

    // When starting to record, stop any current playback
    const handleRecStart = () => {
        stopAudio();
    };

    return (
        <div className="flex flex-col w-full h-full bg-gray-100/60 backdrop-blur-2xl md:rounded-3xl shadow-2xl shadow-indigo-500/10 border border-white/50 overflow-hidden relative">
            <ChatHeader
                onClose={() => { }} // No-op since it's not a modal anymore
                status={!isConnected ? "Connecting..." : isTyping ? "Processing..." : isListening ? "Listening..." : "Online"}
            />

            <ChatMessages messages={messages} isTyping={isTyping} />

            {messages.length <= 1 && (
                <div className="px-4 pb-2 grid grid-cols-2 gap-2">
                    {[
                        "What is the price of Bitcoin?",
                        "What is the latest crypto news?",
                        "Show me the network stats for Dogecoin",
                        "Tell me the history of Bitcoin"
                    ].map((prompt, index) => (
                        <button
                            key={index}
                            onClick={() => handleSendMessage(prompt)}
                            className="text-left text-xs bg-white hover:bg-white/80 border border-white/60 hover:border-violet-200 text-slate-600 hover:text-violet-600 p-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            <ChatInput
                onSendMessage={handleSendMessage}
                isListening={isListening}
                setIsListening={(val) => {
                    if (val) handleRecStart();
                    setIsListening(val);
                }}
                currentTranscript={currentTranscript}
                onAudioChunk={handleAudioChunk}
                onRecordingStop={handleRecordingStop}
            />
        </div>
    );
};

export default ChatbotPanel;