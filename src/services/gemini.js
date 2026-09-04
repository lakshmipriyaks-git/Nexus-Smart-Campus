import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with the key from environment variables
// Note: In a real production app, you should proxy these requests through a backend
// to avoid exposing your API key. For this local demo, we use the key directly.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

export const initializeGemini = () => {
    if (API_KEY) {
        genAI = new GoogleGenerativeAI(API_KEY);
        // System instruction to define persona
        const systemInstruction = `You are BOB, a friendly and helpful AI Learning Assistant for a student/teacher dashboard application.
        
        Your goals are:
        1. Help students organize their tasks and understand their study material.
        2. Help teachers track student performance and identify at-risk students.
        3. Be concise, encouraging, and professional.
        4. When analyzing data, look for trends and provide actionable insights.
        5. Use markdown to format your responses (bold for emphasis, lists for steps).
        
        If asked about your identity, say you are BOB (Best Online Buddy), the AI assistant for this platform.`;

        model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction
        });
        console.log("✅ Gemini API initialized successfully with model: gemini-2.5-flash");
        return true;
    }
    console.warn("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    return false;
};

const responseCache = new Map();
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
let lastCallTime = 0;

export const generateResponseStream = async (prompt, history = [], onChunk) => {
    // 1. Offline Check (Dependency Risk Fix)
    if (!navigator.onLine) {
        onChunk("⚠️ I am currently offline. Please check your internet connection. I can still help you organize your tasks locally!");
        return;
    }

    // 2. Rate Limiting (Cost & Latency Fix)
    const now = Date.now();
    if (now - lastCallTime < RATE_LIMIT_DELAY) {
        onChunk("⏳ Whoa, slow down a bit! I'm thinking...");
        return;
    }
    lastCallTime = now;

    // 3. Caching (Cost Fix)
    // Create a simple cache key based on the last message
    const cacheKey = JSON.stringify({ prompt, lastHistory: history[history.length - 1] });
    if (responseCache.has(cacheKey)) {
        console.log("⚡ Serving from cache");
        const cachedResponse = responseCache.get(cacheKey);
        // Simulate streaming for cached response
        const words = cachedResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
            const chunk = (i === 0 ? '' : ' ') + words[i];
            onChunk(chunk);
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate typing speed
        }
        return;
    }

    if (!model) {
        if (!initializeGemini()) {
            onChunk("I'm sorry, but I can't connect to my brain right now. Please check if the API Key is configured.");
            return;
        }
    }

    try {
        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
        });

        const result = await chat.sendMessageStream(prompt);
        let fullResponse = "";

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            onChunk(chunkText);
        }

        // Cache the successful full response
        responseCache.set(cacheKey, fullResponse);

        // Limit cache size to prevent memory leaks
        if (responseCache.size > 50) {
            const firstKey = responseCache.keys().next().value;
            responseCache.delete(firstKey);
        }

        return;
    } catch (error) {
        console.error("Error generating response:", error);

        let errorMessage = `I encountered an error: ${error.message || 'Unknown error'}`;

        if (error.message?.includes('API key')) {
            errorMessage = "API Key error. Please check that your VITE_GEMINI_API_KEY in the .env file is valid.";
        } else if (error.status === 429) {
            errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
        } else if (error.status === 403) {
            errorMessage = "Access forbidden. Please verify your API key has the correct permissions.";
        }

        onChunk(errorMessage);
    }
};

// Keep the non-streaming version for backward compatibility or specific use cases if needed, 
// but we'll primarily use the stream.
export const generateResponse = async (prompt, history = []) => {
    // ... (keeping this as a fallback or for non-streaming calls if any)
    // For now, let's just redirect to a non-streaming wrapper if strictly needed, 
    // but for this refactor we are moving to streaming.
    // Let's keep the original implementation for safety, but we will use generateResponseStream in the UI.
    if (!model) initializeGemini();
    try {
        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
        });
        const result = await chat.sendMessage(prompt);
        return result.response.text();
    } catch (e) { return "Error: " + e.message; }
};

export const analyzeImage = async (imageBase64, prompt) => {
    if (!model) {
        if (!initializeGemini()) {
            return "I'm sorry, but I can't connect to my brain right now. Please check if the API Key is configured.";
        }
    }

    try {
        // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
        const base64Data = imageBase64.split(',')[1] || imageBase64;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg", // Assuming JPEG for simplicity, can be dynamic
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error analyzing image:", error);
        return "I had trouble reading that image. Please try uploading a clear photo.";
    }
};

export const analyzeDocument = async (documentText, prompt, metadata) => {
    if (!model) {
        if (!initializeGemini()) {
            return "I'm sorry, but I can't connect to my brain right now. Please check if the API Key is configured.";
        }
    }

    try {
        // Truncate very long documents to avoid token limits
        const maxLength = 15000; // Rough character limit
        const truncatedText = documentText.length > maxLength
            ? documentText.substring(0, maxLength) + "\n\n[Document truncated due to length...]"
            : documentText;

        const fullPrompt = `Document: ${metadata.fileName}
Type: ${metadata.fileType.toUpperCase()}
Size: ${(metadata.fileSize / 1024).toFixed(2)} KB

Content:
${truncatedText}

${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error analyzing document:", error);
        console.error("Error details:", {
            message: error.message,
            status: error.status,
            statusText: error.statusText
        });

        if (error.message?.includes('API key')) {
            return "API Key error. Please check that your VITE_GEMINI_API_KEY in the .env file is valid.";
        }

        return `I encountered an error analyzing the document: ${error.message || 'Unknown error'}. Please try again.`;
    }
};

export const analyzeGradeSheet = async (imageFile) => {
    if (!genAI) {
        if (!initializeGemini()) {
            throw new Error("Gemini API Key is missing or invalid.");
        }
    }

    try {
        // Use a model that supports vision, like gemini-1.5-flash
        const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const imageBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });

        const prompt = `
        Analyze this image of a grade sheet. 
        Extract the student names and their marks/grades.
        Return ONLY a JSON array of objects with this structure:
        [
            { "studentName": "Name", "marks": 85 }
        ]
        If you can't read a name or mark, skip it.
        Do not include any markdown formatting or backticks. Just the raw JSON string.
        `;

        const result = await visionModel.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: imageFile.type
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error analyzing grade sheet:", error);
        throw error;
    }
};
