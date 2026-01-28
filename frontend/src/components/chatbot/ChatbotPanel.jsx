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
    } = useChatWebSocket('ws://localhost:8001/ws/chat/user-session-1');

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
        <div className="flex flex-col w-full h-full glass md:rounded-2xl shadow-none md:shadow-[0_0_50px_rgba(0,0,0,0.5)] border-0 md:border border-neon-blue/30 overflow-hidden relative">
            <ChatHeader
                onClose={() => { }} // No-op since it's not a modal anymore
                status={!isConnected ? "Connecting..." : isTyping ? "Processing..." : isListening ? "Listening..." : "Online"}
            />

            <ChatMessages messages={messages} isTyping={isTyping} />

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
