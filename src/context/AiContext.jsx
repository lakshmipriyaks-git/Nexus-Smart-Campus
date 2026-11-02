import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { generateResponse, generateResponseStream, analyzeImage, analyzeDocument, initializeGemini } from '../services/gemini';
import { parseDocument } from '../services/documentParser';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';
import { buildCampusAiContext, getContextualSuggestions } from '../services/aiContextBuilder';

const AiContext = createContext();

export function useAi() {
    return useContext(AiContext);
}

export function AiProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const dataContext = useData();
    const location = useLocation();

    // Default greeting personalized by role and name
    const defaultWelcomeMessage = useMemo(() => {
        const rawName = user?.name || 'there';
        const cleanName = rawName.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').split(' ')[0] || 'there';
        const role = (user?.role || 'student').toLowerCase();

        if (role === 'teacher' || role === 'staff') {
            return `Hello Prof. ${cleanName}! I'm BOB, your NEXUS Academic Assistant. I can help summarize your class rosters, track student attendance, check VTU CIE requirements, or analyze exam questions. How can I assist your teaching today?`;
        }
        if (role === 'hod') {
            return `Greetings HOD ${cleanName}! I'm BOB, your Campus Intelligence Copilot. I can provide departmental summaries, monitor faculty allocations, and check grievance resolution statuses. What would you like to review?`;
        }
        return `Hi ${cleanName}! I'm BOB, your NEXUS Campus AI Assistant. I can check your subject-wise attendance, upcoming assignment deadlines, bus shuttle timings, or summarize study materials (PDF/DOCX). How can I help you today?`;
    }, [user?.name, user?.role]);

    const [messages, setMessages] = useState([
        { id: 'welcome', role: 'model', content: defaultWelcomeMessage }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // Re-initialize greeting when user switches
    useEffect(() => {
        setMessages(prev => {
            if (prev.length === 1 && prev[0].id === 'welcome') {
                return [{ id: 'welcome', role: 'model', content: defaultWelcomeMessage }];
            }
            return prev;
        });
    }, [defaultWelcomeMessage]);

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
        setMessages([{ id: 'welcome', role: 'model', content: defaultWelcomeMessage }]);
    };

    // Contextual suggestions based on user role and current page
    const suggestions = useMemo(() => {
        return getContextualSuggestions({
            role: user?.role || 'student',
            locationPath: location.pathname
        });
    }, [user?.role, location.pathname]);

    const sendMessage = async (text, image = null, document = null) => {
        addMessage('user', text);
        setIsLoading(true);

        // Create a placeholder message for the bot
        const botMessageId = addMessage('model', '');

        try {
            // Build rich role-aware & page-aware campus context
            const campusContext = buildCampusAiContext({
                user,
                locationPath: location.pathname,
                dataContext
            });

            const enrichedPrompt = `${campusContext}\n\n[USER QUESTION]\n${text}`;

            if (document) {
                // Document analysis
                const { text: documentText, metadata } = await parseDocument(document);
                const responseText = await analyzeDocument(documentText, enrichedPrompt, metadata);
                updateMessage(botMessageId, responseText);
            } else if (image) {
                // Image analysis
                const responseText = await analyzeImage(image, enrichedPrompt);
                updateMessage(botMessageId, responseText);
            } else {
                // Text chat with streaming
                const history = messages
                    .filter(m => m.id !== 'welcome')
                    .slice(-8)
                    .map(m => ({ role: m.role, content: m.content }));

                let fullResponse = "";

                await generateResponseStream(enrichedPrompt, history, (chunk) => {
                    fullResponse += chunk;
                    updateMessage(botMessageId, fullResponse);
                });
            }
        } catch (error) {
            console.error("Error in sendMessage:", error);
            updateMessage(botMessageId, error.message || "I encountered an issue connecting to the campus intelligence service. Please verify your internet connection and try again.");
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
        clearChat,
        suggestions
    };

    return (
        <AiContext.Provider value={value}>
            {children}
        </AiContext.Provider>
    );
}
