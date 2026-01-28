import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatMessages = ({ messages, isTyping }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={clsx(
                        "flex w-full",
                        msg.isUser ? "justify-end" : "justify-start"
                    )}
                >
                    {!msg.isUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple p-[1px] mr-2 shrink-0">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">AI</span>
                            </div>
                        </div>
                    )}

                    <div
                        className={clsx(
                            "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                            msg.isUser
                                ? "bg-neon-blue/20 text-white border border-neon-blue/30 rounded-br-none"
                                : "bg-white/5 text-gray-200 border border-white/10 rounded-bl-none"
                        )}
                    >
                        {msg.isUser ? (
                            msg.text
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown
                                    components={{
                                        // Override standard elements for custom styling
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-neon-blue hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                        code: ({ node, inline, className, children, ...props }) => {
                                            return inline ? (
                                                <code className="bg-white/10 px-1 py-0.5 rounded text-neon-blue font-mono text-xs" {...props}>
                                                    {children}
                                                </code>
                                            ) : (
                                                <code className="block bg-black/50 p-2 rounded-lg text-xs font-mono my-2 whitespace-pre-wrap" {...props}>
                                                    {children}
                                                </code>
                                            )
                                        }
                                    }}
                                >
                                    {msg.text || ''}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {isTyping && (
                <div className="flex justify-start">
                    <div className="w-8 h-8 mr-2 shrink-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessages;
