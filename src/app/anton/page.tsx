'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useChatStorage, Message } from '@/hooks/useChatStorage';

// Inline Icons to avoid extra dependencies
const SearchIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const TrashIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const XIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default function AntonPage() {
    const { user } = useAuth();
    const { messages, addMessage, clearHistory, isLoaded } = useChatStorage(user?.id);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll on new messages only if not searching
    useEffect(() => {
        if (!isSearchOpen && searchQuery === '') {
            scrollToBottom();
        }
    }, [messages, isSearchOpen, searchQuery]);

    // Filter messages based on search
    const displayedMessages = useMemo(() => {
        if (!searchQuery.trim()) return messages;
        return messages.filter(msg =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [messages, searchQuery]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        // Clear search when sending new message
        if (isSearchOpen) {
            setSearchQuery('');
            setIsSearchOpen(false);
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        addMessage(userMessage);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('auth_token');

            // Context window: Last 8 messages
            const historyContext = [...messages, userMessage]
                .slice(-8)
                .map(m => ({ role: m.role, content: m.content }));

            if (token) {
                const response = await fetch('/api/anton', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        message: userMessage.content,
                        history: historyContext
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const assistantMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: data.reply_text,
                        timestamp: new Date()
                    };
                    addMessage(assistantMessage);
                    setIsLoading(false);
                    return;
                }
            }

            throw new Error('API failed');

        } catch (error) {
            console.error('Chat error:', error);
            // Fallback response
            setTimeout(() => {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "I'm having trouble connecting right now. Please try again.",
                    timestamp: new Date()
                };
                addMessage(assistantMessage);
                setIsLoading(false);
            }, 1000);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Text highlighting helper
    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} style={{ backgroundColor: 'rgba(255, 255, 0, 0.4)' }}>{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    if (!isLoaded) return <div style={{ padding: 20 }}>Loading chat...</div>;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            background: 'var(--background)',
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        }}>
            {/* Header */}
            <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid #0F121C' }} />
                    </div>
                    <div>
                        <h1 style={{ color: 'var(--foreground)', fontSize: '18px', fontWeight: 600, margin: 0 }}>
                            Anton
                        </h1>
                        <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                            Your AI Co-founder
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => {
                            setIsSearchOpen(!isSearchOpen);
                            if (isSearchOpen) setSearchQuery('');
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}
                        aria-label="Toggle search"
                    >
                        {isSearchOpen ? <XIcon size={20} /> : <SearchIcon size={20} />}
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to clear your chat history?')) {
                                clearHistory();
                            }
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                        title="Clear History"
                        aria-label="Clear history"
                    >
                        <TrashIcon size={20} />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {isSearchOpen && (
                <div style={{
                    padding: '12px 24px',
                    borderBottom: '1px solid var(--card-border)',
                    background: 'var(--card-bg)'
                }}>
                    <Input
                        placeholder="Search conversation..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        style={{
                            background: 'var(--background)',
                            borderColor: 'var(--card-border)',
                            color: 'var(--foreground)',
                            width: '100%'
                        }}
                    />
                </div>
            )}

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                paddingBottom: '180px',
                WebkitOverflowScrolling: 'touch'
            }}>
                {displayedMessages.length === 0 && !isLoading && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--muted)',
                        textAlign: 'center',
                        padding: '40px'
                    }}>
                        <p style={{ fontSize: '15px', margin: 0 }}>
                            {searchQuery ? 'No messages found.' : 'Ask me anything about your business'}
                        </p>
                    </div>
                )}

                {displayedMessages.map((message) => (
                    <div
                        key={message.id}
                        style={{
                            display: 'flex',
                            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                        }}
                    >
                        <div style={{
                            maxWidth: '80%',
                            padding: '12px 16px',
                            borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: message.role === 'user' ? 'var(--brand-blue)' : 'var(--card-bg)',
                            color: message.role === 'user' ? 'white' : 'var(--foreground)',
                            fontSize: '15px',
                            lineHeight: '1.5'
                        }}>
                            {highlightText(message.content, searchQuery)}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '16px 16px 16px 4px',
                            background: 'var(--card-bg)',
                            color: 'var(--muted)',
                            fontSize: '15px'
                        }}>
                            Thinking...
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                position: 'fixed',
                bottom: '90px',
                left: 0,
                right: 0,
                padding: '16px 24px',
                background: 'var(--background)',
                borderTop: '1px solid var(--card-border)'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                }}>
                    <Input
                        placeholder="Ask Anton anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            background: 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                            color: 'var(--foreground)'
                        }}
                    />
                    <Button
                        variant="primary"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        style={{
                            background: 'var(--brand-blue)',
                            color: 'white',
                            padding: '12px 20px'
                        }}
                    >
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
}
