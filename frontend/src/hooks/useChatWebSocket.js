import { useState, useEffect, useRef, useCallback } from 'react';

export const useChatWebSocket = (url) => {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState(""); // For real-time feedback

    // Refs for socket and audio
    const socketRef = useRef(null);
    const audioQueueRef = useRef([]);
    const isPlayingRef = useRef(false);
    const currentAudioRef = useRef(null);

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        socketRef.current = new WebSocket(url);

        socketRef.current.onopen = () => {
            console.log("WebSocket Connected");
            setIsConnected(true);
        };

        socketRef.current.onclose = () => {
            console.log("WebSocket Disconnected");
            setIsConnected(false);
            // Attempt reconnect after 3s
            setTimeout(() => {
                console.log("Attempting to reconnect...");
                connect();
            }, 3000);
        };

        socketRef.current.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "transcript") {
                // User's text recognized
                setIsTyping(true);
                setMessages(prev => [...prev, { id: Date.now(), text: data.text, isUser: true }]);
            } else if (data.type === "response.text_partial") {
                setIsTyping(false); // We have started receiving content
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && !lastMsg.isUser) {
                        // Append to existing AI message
                        return [
                            ...prev.slice(0, -1),
                            { ...lastMsg, text: lastMsg.text + data.text }
                        ];
                    } else {
                        // Create new AI message
                        return [...prev, { id: Date.now(), text: data.text, isUser: false }];
                    }
                });
            } else if (data.type === "response.text") {
                // Final text - ensure full consistency/final update
                // Optional: we can just ignore this if we trust partials, or use it to "seal" the message
                // For now, let's just make sure the state matches this final text
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && !lastMsg.isUser) {
                        // Overwrite with full final text to be safe
                        return [...prev.slice(0, -1), { ...lastMsg, text: data.text }];
                    }
                    return prev;
                });
                setIsTyping(false);
            } else if (data.type === 'transcript_partial') {
                setCurrentTranscript(data.text);
            } else if (data.type === 'transcript') {
                setCurrentTranscript(data.text);
                setMessages(prev => [...prev, { id: Date.now(), text: data.text, isUser: true }]);
                setCurrentTranscript("");
                setIsTyping(true);
            } else if (data.type === "response.audio") {
                // Queue Audio Chunk
                playAudioChunk(data.data);
            } else if (data.type === "error") {
                console.error("Socket Error:", data.message);
                setIsTyping(false);
            }
        };
    }, [url]);

    const playAudioChunk = (base64Audio) => {
        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        audioQueueRef.current.push(audioSrc);
        processQueue();
    };

    const processQueue = () => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

        isPlayingRef.current = true;
        const nextAudio = audioQueueRef.current.shift();
        const audio = new Audio(nextAudio);
        currentAudioRef.current = audio;

        audio.play().catch(e => console.error("Playback error", e));

        audio.onended = () => {
            isPlayingRef.current = false;
            processQueue();
        };
    };

    const stopAudio = () => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        audioQueueRef.current = [];
        isPlayingRef.current = false;

        // Send stop signal to backend to clear its buffers
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "stop" }));
        }
    };

    const sendAudioChunk = (blob) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            // Send binary directly? Or array buffer?
            // WebSocket.send supports Blob or ArrayBuffer
            socketRef.current.send(blob);
        }
    };

    const sendTranscribeRequest = () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "transcribe_request" }));
        }
    };

    const sendMessage = (text) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "text_input",
                text: text
            }));
            // We optimize by setting typing true locally usually, but backend will echo/respond fast
            setIsTyping(true);
        } else {
            console.warn("WebSocket not connected");
            alert("Not connected to server. Please wait for reconnection.");
            // Optional: Try reconnecting manually?
            if (!isConnected) connect();
        }
    };

    useEffect(() => {
        connect();
        return () => {
            socketRef.current?.close();
        };
    }, [connect]);

    return {
        isConnected,
        messages,
        setMessages, // to allow manual clearing or adding
        isTyping,
        sendAudioChunk,
        sendTranscribeRequest,
        stopAudio,
        sendMessage,
        currentTranscript
    };
};
