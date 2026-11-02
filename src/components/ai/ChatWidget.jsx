import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAi } from '../../context/AiContext';
import { useTheme } from '../../context/ThemeContext';
import {
    Bot,
    Send,
    X,
    Loader2,
    Paperclip,
    FileText,
    Trash2,
    Sparkles,
    Maximize2,
    Minimize2,
    ArrowUpRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { getSupportedFileTypes } from '../../services/documentParser';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWidget() {
    const { isOpen, toggleChat, messages, sendMessage, isLoading, clearChat, suggestions = [] } = useAi();
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isExpanded]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileType = file.name.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);
        const isDocument = ['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(fileType);

        if (isImage) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
                setSelectedDocument(null);
            };
            reader.readAsDataURL(file);
        } else if (isDocument) {
            setSelectedDocument(file);
            setSelectedImage(null);
        }
    };

    const handleSend = async (e, suggestedPrompt = null) => {
        if (e) e.preventDefault();
        const textToSend = suggestedPrompt || input;
        if ((!textToSend.trim() && !selectedImage && !selectedDocument) || isLoading) return;

        const message = textToSend;
        const image = selectedImage;
        const document = selectedDocument;
        setInput('');
        setSelectedImage(null);
        setSelectedDocument(null);

        await sendMessage(message, image, document);
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);

    // Custom renderer for markdown links to navigate smoothly within NEXUS
    const renderLink = ({ href, children }) => {
        const isInternal = href && href.startsWith('/');
        if (isInternal) {
            return (
                <button
                    type="button"
                    onClick={() => {
                        navigate(href);
                    }}
                    className={clsx(
                        "inline-flex items-center gap-0.5 font-bold underline transition-colors",
                        darkMode ? "text-[#22D3EE] hover:text-white" : "text-[#6558E8] hover:text-[#5244DE]"
                    )}
                >
                    {children}
                    <ArrowUpRight className="h-3 w-3 inline" />
                </button>
            );
        }
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                    "inline-flex items-center gap-0.5 font-bold underline",
                    darkMode ? "text-[#22D3EE] hover:text-white" : "text-[#6558E8] hover:text-[#5244DE]"
                )}
            >
                {children}
                <ArrowUpRight className="h-3 w-3 inline" />
            </a>
        );
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            width: isExpanded ? 640 : 380,
                            height: isExpanded ? 720 : 540
                        }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        style={{ zIndex: 9999 }}
                        className={clsx(
                            "mb-3 max-h-[calc(100vh-80px)] w-[calc(100vw-32px)] max-w-[92vw] sm:max-w-[640px] flex flex-col rounded-2xl overflow-hidden border transition-colors shadow-2xl",
                            darkMode
                                ? "border-[#1E2D4A] bg-[#0A0F1D] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                                : "border-[#E2E6F2] bg-[#FFFFFF] shadow-[0_20px_50px_rgba(32,36,66,0.14)]"
                        )}
                    >
                        {/* Header */}
                        <div className={clsx(
                            "p-3.5 border-b flex justify-between items-center shrink-0 transition-colors",
                            darkMode
                                ? "bg-[#070A11] border-[#1E2D4A] text-white"
                                : "bg-[#F5F6FF] border-[#E2E6F2] text-[#202442]"
                        )}>
                            <div className="flex items-center gap-2.5">
                                <div className={clsx(
                                    "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                    darkMode
                                        ? "bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#22D3EE] shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                                        : "bg-[#6558E8]/10 border border-[#6558E8]/25 text-[#6558E8] shadow-[0_2px_8px_rgba(101,88,232,0.15)]"
                                )}>
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h3 className={clsx(
                                            "font-display font-bold text-xs tracking-tight flex items-center gap-1",
                                            darkMode ? "text-white" : "text-[#202442]"
                                        )}>
                                            BOB Campus AI
                                        </h3>
                                        <span className={clsx(
                                            "text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border",
                                            darkMode
                                                ? "bg-[#06B6D4]/20 text-[#22D3EE] border-[#06B6D4]/40"
                                                : "bg-[#6558E8]/10 text-[#6558E8] border-[#6558E8]/30"
                                        )}>
                                            Gemini 3.8
                                        </span>
                                    </div>
                                    <p className={clsx(
                                        "text-[10px] font-mono",
                                        darkMode ? "text-slate-400" : "text-[#59627E]"
                                    )}>
                                        INTELLIGENT CAMPUS COPILOT
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleExpand}
                                    className={clsx(
                                        "transition-colors p-1.5 rounded-lg hidden sm:block",
                                        darkMode
                                            ? "text-slate-400 hover:text-white hover:bg-[#162238]"
                                            : "text-[#59627E] hover:text-[#202442] hover:bg-[#EEF1FC]"
                                    )}
                                    title={isExpanded ? "Minimize" : "Maximize"}
                                >
                                    {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                    onClick={clearChat}
                                    className={clsx(
                                        "transition-colors p-1.5 rounded-lg",
                                        darkMode
                                            ? "text-slate-400 hover:text-white hover:bg-[#162238]"
                                            : "text-[#59627E] hover:text-[#202442] hover:bg-[#EEF1FC]"
                                    )}
                                    title="Reset Conversation"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={toggleChat}
                                    className={clsx(
                                        "transition-colors p-1.5 rounded-lg",
                                        darkMode
                                            ? "text-slate-400 hover:text-white hover:bg-[#162238]"
                                            : "text-[#59627E] hover:text-[#202442] hover:bg-[#EEF1FC]"
                                    )}
                                    title="Close Window"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className={clsx(
                            "flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth custom-scrollbar transition-colors",
                            darkMode ? "bg-[#070A11]" : "bg-[#F5F6FF]"
                        )}>
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={msg.id || index}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={clsx(
                                        "flex gap-2.5 max-w-[88%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={clsx(
                                        "h-6 w-6 rounded-md flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                                        msg.role === 'user'
                                            ? darkMode
                                                ? "bg-[#06B6D4] text-[#070A11]"
                                                : "bg-[#6558E8] text-white"
                                            : darkMode
                                                ? "bg-[#111A2E] text-[#22D3EE] border border-[#1E2D4A]"
                                                : "bg-[#FFFFFF] text-[#6558E8] border border-[#E2E6F2] shadow-xs"
                                    )}>
                                        {msg.role === 'user' ? "U" : <Bot className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className={clsx(
                                        "p-3 rounded-xl text-xs leading-relaxed shadow-sm transition-colors",
                                        msg.role === 'user'
                                            ? darkMode
                                                ? "bg-[#06B6D4] text-[#070A11] font-medium rounded-tr-none"
                                                : "bg-[#6558E8] text-white font-medium rounded-tr-none shadow-xs"
                                            : darkMode
                                                ? "bg-[#0D1527] text-slate-200 rounded-tl-none border border-[#1E2D4A]"
                                                : "bg-[#FFFFFF] text-[#202442] rounded-tl-none border border-[#E2E6F2] shadow-xs"
                                    )}>
                                        <div className={clsx(
                                            "prose prose-xs max-w-none leading-relaxed",
                                            msg.role === 'user'
                                                ? darkMode ? "text-[#070A11]" : "text-white"
                                                : darkMode ? "prose-invert" : "text-[#202442]"
                                        )}>
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-0.5" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5" {...props} />,
                                                    li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                                    a: renderLink,
                                                    strong: ({ node, ...props }) => <strong className={darkMode ? "text-white font-bold" : "text-[#202442] font-bold"} {...props} />,
                                                    code: ({ node, inline, className, children, ...props }) => (
                                                        <code className={clsx(
                                                            "rounded px-1 py-0.5 font-mono text-[11px] border",
                                                            darkMode
                                                                ? "bg-[#070A11] text-[#22D3EE] border-[#1E2D4A]"
                                                                : "bg-[#EEF1FC] text-[#6558E8] border-[#CCD3E5]"
                                                        )} {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Suggestion Chips Section (shown if only 1 welcome message is present) */}
                            {messages.length === 1 && suggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="pt-2 space-y-2"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles className={clsx("h-3 w-3", darkMode ? "text-[#22D3EE]" : "text-[#6558E8]")} />
                                        <p className={clsx(
                                            "text-[10px] uppercase font-mono font-bold tracking-wider",
                                            darkMode ? "text-slate-400" : "text-[#59627E]"
                                        )}>
                                            Suggested Questions
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        {suggestions.map((chip, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSend(null, chip)}
                                                className={clsx(
                                                    "w-full text-left text-xs p-2.5 rounded-xl border transition-all shadow-xs flex items-center justify-between group",
                                                    darkMode
                                                        ? "bg-[#0D1527] border-[#1E2D4A] text-slate-300 hover:border-[#06B6D4]/60 hover:text-[#22D3EE]"
                                                        : "bg-[#FFFFFF] border-[#E2E6F2] text-[#202442] hover:border-[#6558E8] hover:text-[#6558E8] hover:bg-[#F5F6FF]"
                                                )}
                                            >
                                                <span className="truncate pr-2">{chip}</span>
                                                <span className={clsx(
                                                    "font-bold text-sm transition-transform group-hover:translate-x-0.5",
                                                    darkMode ? "text-[#06B6D4]" : "text-[#6558E8]"
                                                )}>→</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex gap-2.5"
                                >
                                    <div className={clsx(
                                        "h-6 w-6 rounded-md flex items-center justify-center shrink-0",
                                        darkMode
                                            ? "bg-[#111A2E] text-[#22D3EE] border border-[#1E2D4A]"
                                            : "bg-[#FFFFFF] text-[#6558E8] border border-[#E2E6F2]"
                                    )}>
                                        <Bot className="h-3.5 w-3.5" />
                                    </div>
                                    <div className={clsx(
                                        "p-3 rounded-xl rounded-tl-none border shadow-sm flex items-center gap-2",
                                        darkMode
                                            ? "bg-[#0D1527] border-[#1E2D4A]"
                                            : "bg-[#FFFFFF] border-[#E2E6F2]"
                                    )}>
                                        <Loader2 className={clsx("h-3.5 w-3.5 animate-spin", darkMode ? "text-[#22D3EE]" : "text-[#6558E8]")} />
                                        <span className={clsx("text-[11px] font-mono", darkMode ? "text-slate-400" : "text-[#59627E]")}>
                                            Connecting to campus telemetry...
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className={clsx(
                            "p-3 border-t shrink-0 transition-colors",
                            darkMode
                                ? "bg-[#0A0F1D] border-[#1E2D4A]"
                                : "bg-[#FFFFFF] border-[#E2E6F2]"
                        )}>
                            {selectedImage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-2 relative inline-block group"
                                >
                                    <img src={selectedImage} alt="Upload preview" className="h-12 w-12 object-cover rounded-lg border shadow-xs" />
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 shadow-xs transition-transform"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </motion.div>
                            )}
                            {selectedDocument && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={clsx(
                                        "mb-2 relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shadow-xs",
                                        darkMode
                                            ? "bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#22D3EE]"
                                            : "bg-[#6558E8]/10 border-[#6558E8]/30 text-[#6558E8]"
                                    )}
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span className="text-xs truncate max-w-[180px] font-medium">{selectedDocument.name}</span>
                                    <button
                                        onClick={() => setSelectedDocument(null)}
                                        className={clsx(
                                            "ml-1 rounded-full p-0.5 transition-colors",
                                            darkMode
                                                ? "bg-[#06B6D4] text-[#070A11] hover:bg-[#22D3EE]"
                                                : "bg-[#6558E8] text-white hover:bg-[#5244DE]"
                                        )}
                                    >
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </motion.div>
                            )}
                            <form onSubmit={(e) => handleSend(e)} className="flex gap-2 items-center">
                                <input
                                    type="file"
                                    accept={`image/*,${getSupportedFileTypes()}`}
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={clsx(
                                        "p-2 rounded-lg transition-colors",
                                        darkMode
                                            ? "text-slate-400 hover:text-[#22D3EE] hover:bg-[#162238]"
                                            : "text-[#59627E] hover:text-[#6558E8] hover:bg-[#EEF1FC]"
                                    )}
                                    title="Attach document (PDF/DOCX) or image"
                                >
                                    <Paperclip className="h-4 w-4" />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask BOB about attendance, classes, bus..."
                                        className={clsx(
                                            "w-full rounded-lg px-3 py-2 text-xs transition-all font-sans",
                                            darkMode
                                                ? "bg-[#0D1527] border border-[#1E2D4A] focus:ring-1 focus:ring-[#06B6D4] focus:border-[#06B6D4] text-white placeholder:text-slate-500"
                                                : "bg-[#F5F6FF] border border-[#E2E6F2] focus:ring-1 focus:ring-[#6558E8] focus:border-[#6558E8] text-[#202442] placeholder:text-[#7E87A2]"
                                        )}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={(!input.trim() && !selectedImage && !selectedDocument) || isLoading}
                                    className={clsx(
                                        "p-2 font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all",
                                        darkMode
                                            ? "bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                                            : "bg-[#6558E8] hover:bg-[#5244DE] text-white shadow-[0_2px_8px_rgba(101,88,232,0.3)]"
                                    )}
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Launcher Button */}
            <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={toggleChat}
                className={clsx(
                    "flex items-center gap-2 px-3.5 py-2.5 rounded-full border transition-all duration-200 text-xs font-semibold select-none shadow-lg",
                    isOpen
                        ? darkMode
                            ? "bg-[#0A0F1D] text-white border-[#1E2D4A] hover:bg-[#111A2E]"
                            : "bg-[#FFFFFF] text-[#202442] border-[#E2E6F2] hover:bg-[#F5F6FF]"
                        : darkMode
                            ? "bg-[#06B6D4] text-[#070A11] border-[#22D3EE] hover:bg-[#22D3EE] shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                            : "bg-[#6558E8] text-white border-[#7A6EED] hover:bg-[#5244DE] shadow-[0_4px_16px_rgba(101,88,232,0.35)]"
                )}
                aria-label="Toggle BOB AI Copilot"
            >
                {isOpen ? (
                    <>
                        <X className="h-4 w-4" />
                        <span>Close</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="h-4 w-4" />
                        <span className="font-bold tracking-tight">BOB AI</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
                    </>
                )}
            </motion.button>
        </div>
    );
}
