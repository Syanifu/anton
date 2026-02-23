import { useState, useEffect, useCallback } from 'react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const STORAGE_KEY_PREFIX = 'anton_chat_history_';
const MAX_MESSAGES = 100;

export function useChatStorage(userId: string | undefined) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load history when userId is available
    useEffect(() => {
        if (!userId) {
            setMessages([]);
            setIsLoaded(true);
            return;
        }

        try {
            const key = `${STORAGE_KEY_PREFIX}${userId}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert timestamp strings back to Date objects
                const hydrated = parsed.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
                setMessages(hydrated);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
            // Fallback to empty on error
            setMessages([]);
        } finally {
            setIsLoaded(true);
        }
    }, [userId]);

    // Save history whenever messages change (debounce could be added if needed, but for <100 msgs it's fast)
    useEffect(() => {
        if (!userId || !isLoaded) return;

        try {
            const key = `${STORAGE_KEY_PREFIX}${userId}`;
            localStorage.setItem(key, JSON.stringify(messages));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }, [messages, userId, isLoaded]);

    const addMessage = useCallback((message: Message) => {
        setMessages(prev => {
            const newHistory = [...prev, message];
            if (newHistory.length > MAX_MESSAGES) {
                // Remove oldest messages to keep the last MAX_MESSAGES
                return newHistory.slice(newHistory.length - MAX_MESSAGES);
            }
            return newHistory;
        });
    }, []);

    const clearHistory = useCallback(() => {
        if (!userId) return;
        setMessages([]);
        try {
            const key = `${STORAGE_KEY_PREFIX}${userId}`;
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to clear chat history:', error);
        }
    }, [userId]);

    return {
        messages,
        addMessage,
        clearHistory,
        isLoaded
    };
}
