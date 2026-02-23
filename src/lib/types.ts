export type Channel = 'whatsapp' | 'slack' | 'email' | 'telegram';

export interface Message {
    id: string;
    sender: 'client' | 'me' | 'ai_draft';
    text: string;
    timestamp: string;
    isRead: boolean;
}

export interface Conversation {
    id: string;
    clientName: string;
    channel: Channel;
    lastMessage: Message;
    unreadCount: number;
    leadScore?: number; // 0 to 1
    status: 'active' | 'idle' | 'lead';
    aiSummary?: string;
    messages: Message[];
}

export interface Invoice {
    id: string;
    clientName: string;
    amount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    dueDate: string;
    platform_fee: number;
    description?: string;
    issuedDate?: string;
}

export interface AIAnalysis {
    summary: string;
    intent: 'project_inquiry' | 'payment_query' | 'scope_clarification' | 'follow_up' | 'scheduling' | 'casual_chat' | 'spam' | 'unknown';
    urgency: 'high' | 'medium' | 'low';
    entities: Record<string, any>;
    suggestedAction: 'create_lead' | 'draft_proposal' | 'ask_clarifying_question' | 'schedule_call' | 'send_invoice' | 'mark_as_spam' | 'none';
    leadScore: number;
}

export interface AIReply {
    short: string;
    detailed: string;
    confidence: number;
}

export type DraftStatus = 'pending' | 'sent' | 'dismissed';
export type ReplyIntent = 'project_inquiry' | 'payment_query' | 'scope_clarification' | 'follow_up' | 'scheduling' | 'casual_chat' | 'introduction';

export interface Draft {
    id: string;
    clientName: string;
    channel: Channel;
    short: string;
    detailed: string;
    confidence: number;
    intent: ReplyIntent;
    status: DraftStatus;
    conversationId?: string;
    createdAt: string;
}

// Database types for Supabase
export interface DbClient {
    id: string;
    user_id: string;
    name: string;
    company?: string;
    phone?: string;
    email?: string;
    channels: Array<{ type: string; handle: string }>;
    tags: string[];
    total_revenue: number;
    active_projects_count: number;
    last_interaction_at?: string;
    ai_notes?: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface DbConversation {
    id: string;
    user_id: string;
    client_id: string;
    channel: Channel;
    external_thread_id: string;
    last_message_at: string;
    created_at: string;
    updated_at: string;
}

export interface DbMessage {
    id: string;
    conversation_id: string;
    direction: 'incoming' | 'outgoing';
    content: string;
    external_message_id?: string;
    created_at: string;
}

export type ProjectStage = 'discovery' | 'proposal' | 'negotiation' | 'active' | 'review' | 'completed' | 'cancelled';
export type ProjectStatus = 'on_track' | 'at_risk' | 'overdue';

export interface DbProject {
    id: string;
    user_id: string;
    client_id?: string;
    lead_id?: string;
    conversation_id?: string;
    title: string;
    description?: string;
    budget?: number;
    currency: string;
    stage: ProjectStage;
    status: ProjectStatus;
    start_date?: string;
    deadline?: string;
    completed_at?: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface DbMilestone {
    id: string;
    project_id: string;
    title: string;
    due_date?: string;
    completed_at?: string;
    sort_order: number;
    created_at: string;
}

// Normalized message format for Anton
export interface NormalizedIncomingMessage {
    user_id: string;
    client_identifier: string;
    client_name: string;
    message_text: string;
    channel: Channel;
    external_thread_id: string;
    external_message_id: string;
    timestamp: string;
}
