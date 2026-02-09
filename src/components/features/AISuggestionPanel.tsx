'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { analyzeMessage, generateReplies } from '@/lib/ai';
import { AIAnalysis, AIReply } from '@/lib/types';

interface AISuggestionPanelProps {
    lastMessageText: string;
    clientName: string;
    onSendReply: (text: string) => void;
}

export const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({ lastMessageText, clientName, onSendReply }) => {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [replies, setReplies] = useState<AIReply | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const fetchAI = async () => {
            setLoading(true);
            try {
                const [analysisResult, repliesResult] = await Promise.all([
                    analyzeMessage(lastMessageText),
                    generateReplies(lastMessageText, clientName)
                ]);
                setAnalysis(analysisResult);
                setReplies(repliesResult);
            } catch (error) {
                console.error("AI Error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAI();
    }, [lastMessageText, clientName]);

    if (loading) {
        return (
            <div className="card shadow-sm animate-pulse" style={{ padding: '16px' }}>
                <p className="text-sm text-muted">Anton is thinking...</p>
            </div>
        );
    }

    if (!analysis || !replies) return null;

    return (
        <Card className="shadow-md animate-slide-in" style={{ border: '1px solid var(--accent-blue)' }}>
            <div className="flex-between" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>✨</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>AI Suggested Reply</span>
                </div>
                <Badge variant={analysis.urgency === 'high' ? 'red' : 'gray'}>
                    {analysis.intent.replace('_', ' ')}
                </Badge>
            </div>

            <div style={{ marginTop: '12px' }}>
                <p className="text-sm" style={{ marginBottom: '8px' }}>
                    <strong>Analysis:</strong> {analysis.summary}
                </p>

                {/* Short Reply Option */}
                <div style={{ background: 'var(--accent-gray-bg)', padding: '8px', borderRadius: '8px', marginBottom: '8px' }}>
                    <p className="text-sm">{replies.short}</p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <Button size="sm" onClick={() => onSendReply(replies.short)}>Send Short</Button>
                    </div>
                </div>

                {/* Detailed Reply Option (Collapsible) */}
                {expanded && (
                    <div style={{ background: 'var(--accent-gray-bg)', padding: '8px', borderRadius: '8px' }}>
                        <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{replies.detailed}</p>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                            <Button size="sm" onClick={() => onSendReply(replies.detailed)}>Send Detailed</Button>
                            <Button size="sm" variant="ghost">Edit</Button>
                        </div>
                    </div>
                )}

                {!expanded && (
                    <div style={{ textAlign: 'center', marginTop: '4px' }}>
                        <span className="text-sm text-muted" style={{ cursor: 'pointer' }} onClick={() => setExpanded(true)}>View Detailed Draft</span>
                    </div>
                )}
            </div>
        </Card>
    );
};
