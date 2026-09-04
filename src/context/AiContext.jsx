import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { generateResponse, generateResponseStream, analyzeImage, analyzeDocument, initializeGemini } from '../services/gemini';
import { parseDocument } from '../services/documentParser';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';
import { ROLES } from '../utils/constants';

const AiContext = createContext();

export function useAi() {
    return useContext(AiContext);
}

export function AiProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 'welcome', role: 'model', content: "Hi! I'm BOB, your AI Learning Assistant. I can help you study, create quizzes, analyze documents (PDF, DOCX, PPT), or analyze your notes. How can I help you today?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const { tasks } = useData();
    const { user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        initializeGemini();
    }, []);

    const toggleChat = () => setIsOpen(!isOpen);

    const addMessage = (role, content) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        setMessages(prev => [...prev, { id, role, content }]);
        return id;
    };

    const updateMessage = (id, content) => {
        setMessages(prev => prev.map(msg =>
            msg.id === id ? { ...msg, content } : msg
        ));
    };

    const clearChat = () => {
        setMessages([{ id: 'welcome', role: 'model', content: "Hi! I'm BOB, your AI Learning Assistant. I can help you study, create quizzes, analyze documents (PDF, DOCX, PPT), or analyze your notes. How can I help you today?" }]);
    };

    const sendMessage = async (text, image = null, document = null) => {
        addMessage('user', text);
        setIsLoading(true);

        // Create a placeholder message for the bot
        const botMessageId = addMessage('model', '');

        try {
            let contextPrompt = `\n\n[System Context]\nCurrent Page: ${location.pathname}\nUser Role: ${user?.role || 'Guest'}\n`;

            // Add specific data context based on role
            if (user?.role === ROLES.TEACHER) {
                // Note: Student data removed - derive from joinRequests if needed
                contextPrompt += `Teacher mode enabled.\n`;
            } else {
                contextPrompt += `Tasks Summary: ${tasks.filter(t => t.status !== 'Completed').length} pending tasks.\n`;
            }

            if (document) {
                // Document analysis (non-streaming for now)
                const { text: documentText, metadata } = await parseDocument(document);
                const responseText = await analyzeDocument(documentText, text + contextPrompt, metadata);
                updateMessage(botMessageId, responseText);
            } else if (image) {
                // Image analysis (non-streaming for now)
                const responseText = await analyzeImage(image, text + contextPrompt);
                updateMessage(botMessageId, responseText);
            } else {
                // Text chat (Streaming)
                const history = messages
                    .filter(m => m.id !== 'welcome')
                    .slice(-10)
                    .map(m => ({ role: m.role, content: m.content }));

                let fullResponse = "";

                await generateResponseStream(text + contextPrompt, history, (chunk) => {
                    fullResponse += chunk;
                    updateMessage(botMessageId, fullResponse);
                });
            }
        } catch (error) {
            console.error("Error in sendMessage:", error);
            updateMessage(botMessageId, error.message || "I'm having trouble connecting right now. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        isOpen,
        toggleChat,
        messages,
        sendMessage,
        isLoading,
        clearChat
    };

    return (
        <AiContext.Provider value={value}>
            {children}
        </AiContext.Provider>
    );
}
