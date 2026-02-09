'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { mockConversations } from '@/lib/data';
import { AISuggestionPanel } from '@/components/features/AISuggestionPanel';
import { Message, Conversation, Channel } from '@/lib/types';

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const [conversation, setConversation] = useState<Conversation | null>(null);

    // Unwrap params safely
    const id = params?.id as string;

    useEffect(() => {
        if (id) {
            const found = mockConversations.find(c => c.id === id);
            if (found) {
                setConversation(found);
            }
        }
    }, [id]);

    const handleSend = (text: string) => {
        if (!conversation) return;
        const newMessage: Message = {
            id: `m_${Date.now()}`,
            sender: 'me',
            text,
            timestamp: new Date().toISOString(),
            isRead: true
        };

        // Optimistic update
        const updated = { ...conversation, messages: [...conversation.messages, newMessage] };
        setConversation(updated);
    };

    if (!conversation) {
        return <div className="container p-4">Loading conversation...</div>;
    }

    // Find last incoming message for context
    const lastIncoming = conversation.messages.length > 0
        ? [...conversation.messages].reverse().find(m => m.sender === 'client')
        : conversation.lastMessage.sender === 'client' ? conversation.lastMessage : null;

    return (
        <main className="container flex-col" style={{ height: '100vh', padding: '0', display: 'flex' }}>
            {/* Top Bar */}
            <header style={{
                padding: 'var(--spacing-md)',
                borderBottom: '1px solid var(--card-border)',
                background: 'var(--card-background)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                position: 'sticky', top: 0, zIndex: 10
            }}>
                <Button variant="ghost" size="sm" onClick={() => router.back()}>Back</Button>
                <div style={{ flex: 1 }}>
                    <h1 className="text-lg">{conversation.clientName}</h1>
                    <Badge variant="blue">{conversation.channel}</Badge>
                </div>
            </header>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--spacing-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {(!conversation.messages || conversation.messages.length === 0) && (
                    <p className="text-muted text-center">No messages yet.</p>
                )}
                {conversation.messages?.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            background: msg.sender === 'me' ? 'var(--accent-blue)' : 'var(--accent-gray-bg)',
                            color: msg.sender === 'me' ? 'white' : 'var(--foreground)',
                            padding: '8px 12px',
                            borderRadius: '16px',
                            borderBottomRightRadius: msg.sender === 'me' ? '4px' : '16px',
                            borderBottomLeftRadius: msg.sender === 'client' ? '4px' : '16px',
                        }}
                    >
                        <p>{msg.text}</p>
                        <span style={{ fontSize: '0.7rem', opacity: 0.7, display: 'block', textAlign: 'right', marginTop: '4px' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
            </div>

            {/* AI Panel / Input Area */}
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--card-background)', borderTop: '1px solid var(--card-border)' }}>
                {lastIncoming && (
                    <AISuggestionPanel
                        lastMessageText={lastIncoming.text}
                        clientName={conversation.clientName}
                        onSendReply={handleSend}
                    />
                )}

                {/* Fallback Input if AI not needed */}
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--card-border)',
                            background: 'var(--background)',
                            color: 'var(--foreground)'
                        }}
                    />
                    <Button size="sm">Send</Button>
                </div>
            </div>
        </main>
    );
}
