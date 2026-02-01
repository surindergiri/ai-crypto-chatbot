import React from 'react';
import { Sparkles, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import tsmLogo from '../../assets/TSM-Logo.png';

const ChatHeader = ({ onClose, status = 'Online' }) => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-between p-6 border-b border-indigo-50/50 bg-white/40 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
                        </div>
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        AI Assistant
                        <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">TSM</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{status}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/docs')}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100/50 rounded-full transition-all group"
                    title="Documentation"
                >
                    <Book className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <div className="w-16 h-10 relative group">
                    <img
                        src={tsmLogo}
                        alt="TSM Logo"
                        className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;
