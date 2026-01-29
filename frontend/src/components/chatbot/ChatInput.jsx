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
        <form onSubmit={handleSubmit} className="p-4 bg-white/40 backdrop-blur-md relative">
            <div className="flex items-center gap-2 bg-white rounded-full p-1.5 shadow-lg shadow-indigo-500/5 border border-indigo-50">
                <button
                    type="button"
                    onClick={handleVoiceClick}
                    className={`p-2.5 rounded-full transition-all duration-300 ${isListening
                        ? 'bg-rose-50 text-rose-500 animate-pulse border border-rose-200'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-500'
                        }`}
                >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                    type="text"
                    value={isListening ? currentTranscript : message}
                    onChange={(e) => !isListening && setMessage(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask Crypto AI..."}
                    className="flex-1 bg-transparent border-none px-2 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0 transition-colors"
                />

                <button
                    type="submit"
                    disabled={!message.trim()}
                    className="p-2.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>

            {isListening && (
                <div className="absolute -top-12 left-0 w-full flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1 bg-indigo-400 animate-wave" style={{
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
