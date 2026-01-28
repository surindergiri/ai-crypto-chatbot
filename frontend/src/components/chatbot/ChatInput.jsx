import React, { useState } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

const ChatInput = ({ onSendMessage, isListening, setIsListening, onAudioChunk, onRecordingStop, currentTranscript }) => {
    const [message, setMessage] = useState('');
    const mediaRecorderRef = React.useRef(null);
    const chunksRef = React.useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    onAudioChunk(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                onRecordingStop();
            };

            mediaRecorderRef.current.start(250); // Timeslice 250ms
            setIsListening(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleVoiceClick = () => {
        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting message:", message); // Debug
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-sm relative">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleVoiceClick}
                    className={`p-2 rounded-full transition-all ${isListening
                        ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500'
                        : 'text-neon-blue hover:bg-neon-blue/10'
                        }`}
                >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                    type="text"
                    value={isListening ? currentTranscript : message}
                    onChange={(e) => !isListening && setMessage(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask Crypto AI..."}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue transition-colors"
                />

                <button
                    type="submit"
                    disabled={!message.trim()}
                    className="p-2 rounded-full bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>

            {isListening && (
                <div className="absolute -top-12 left-0 w-full flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1 bg-neon-blue animate-wave" style={{
                            height: '20px',
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '0.5s'
                        }}></div>
                    ))}
                </div>
            )}
        </form>
    );
};

export default ChatInput;
