import React, { useState, useRef, useEffect } from 'react';
import { useAi } from '../../context/AiContext';
import { Bot, Send, X, Loader2, Paperclip, FileText, Trash2, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { getSupportedFileTypes } from '../../services/documentParser';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWidget() {
    const { isOpen, toggleChat, messages, sendMessage, isLoading, clearChat } = useAi();
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

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!input.trim() && !selectedImage && !selectedDocument) || isLoading) return;

        const message = input;
        const image = selectedImage;
        const document = selectedDocument;
        setInput('');
        setSelectedImage(null);
        setSelectedDocument(null);

        await sendMessage(message, image, document);
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            width: isExpanded ? 600 : 380,
                            height: isExpanded ? 800 : 600
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{ zIndex: 9999 }}
                        className="mb-4 max-h-[calc(100vh-120px)] max-w-[90vw] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-white/20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center text-white shrink-0 shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                    <Bot className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base flex items-center gap-1">
                                        BOB <Sparkles className="h-3 w-3 text-yellow-300" />
                                    </h3>
                                    <p className="text-xs text-indigo-100 font-medium">AI Learning Assistant</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleExpand}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full hidden sm:block"
                                    title={isExpanded ? "Minimize" : "Maximize"}
                                >
                                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </button>
                                <button
                                    onClick={clearChat}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                                    title="Clear Chat"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={toggleChat}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50 scroll-smooth">
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className={clsx(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={clsx(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white"
                                            : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                                    )}>
                                        {msg.role === 'user' ? <span className="text-xs font-bold">ME</span> : <Bot className="h-5 w-5" />}
                                    </div>
                                    <div className={clsx(
                                        "p-3.5 rounded-2xl text-sm shadow-sm backdrop-blur-sm",
                                        msg.role === 'user'
                                            ? "bg-indigo-600 text-white rounded-tr-none bg-gradient-to-br from-indigo-600 to-blue-600"
                                            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700"
                                    )}>
                                        <div className={clsx("prose prose-sm max-w-none leading-relaxed", msg.role === 'user' && "prose-invert")}>
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                                    li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                                    code: ({ node, inline, className, children, ...props }) => (
                                                        <code className={clsx("bg-black/10 rounded px-1 py-0.5 font-mono text-xs", className)} {...props}>
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
                            {isLoading && messages[messages.length - 1]?.content === '' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex gap-3"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-2">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Loader2 className="h-4 w-4 text-purple-600" />
                                        </motion.div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Thinking...</span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
                            {selectedImage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-2 relative inline-block group"
                                >
                                    <img src={selectedImage} alt="Upload preview" className="h-16 w-16 object-cover rounded-xl border-2 border-indigo-100 shadow-sm" />
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-transform group-hover:scale-110"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </motion.div>
                            )}
                            {selectedDocument && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-2 relative inline-flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 shadow-sm"
                                >
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm text-blue-900 truncate max-w-[200px] font-medium">{selectedDocument.name}</span>
                                    <button
                                        onClick={() => setSelectedDocument(null)}
                                        className="ml-1 bg-blue-500 text-white rounded-full p-0.5 hover:bg-blue-600 shadow-sm transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </motion.div>
                            )}
                            <form onSubmit={handleSend} className="flex gap-2 items-end">
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
                                    className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                                    title="Upload image or document"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask BOB anything..."
                                        className="w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 transition-all shadow-inner placeholder:text-gray-400"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={(!input.trim() && !selectedImage && !selectedDocument) || isLoading}
                                    className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-95"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleChat}
                className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 border-2 border-white/20"
            >
                {isOpen ? <X className="h-7 w-7" /> : <Bot className="h-9 w-9" />}
            </motion.button>
        </div>
    );
}
