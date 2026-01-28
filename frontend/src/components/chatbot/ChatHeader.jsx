import React from 'react';
import { X, Sparkles } from 'lucide-react';

const ChatHeader = ({ onClose, status = 'Online' }) => {
    return (
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md rounded-t-2xl">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple p-[2px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-neon-blue animate-pulse" />
                        </div>
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-start-up border border-black rounded-full"></span>
                </div>
                <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                        AI Assistant
                        <span className="text-[10px] bg-neon-blue/20 text-neon-blue px-2 py-0.5 rounded-full border border-neon-blue/30">BETA</span>
                    </h3>
                    <p className="text-xs text-neon-blue animate-pulse">{status}</p>
                </div>
            </div>

            <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default ChatHeader;
