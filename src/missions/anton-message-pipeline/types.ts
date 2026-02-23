import { SupabaseClient } from '@supabase/supabase-js';
import { Channel } from '@/lib/types';

// Re-export Channel for use by step modules
export type { Channel };

export interface MissionContext {
    userId: string;
    supabase: SupabaseClient;
    input: {
        message: {
            id: string;
            content: string;
            direction: 'incoming' | 'outgoing';
            createdAt: string;
        };
        conversation: {
            id: string;
            channel: Channel;
            externalThreadId: string;
        };
        client: {
            id: string;
            name: string;
            phone?: string;
            email?: string;
            conversationCount: number;
        };
        conversationHistory?: MessageHistoryItem[];
    };
}

export interface MessageHistoryItem {
    role: 'client' | 'freelancer';
    content: string;
    timestamp: string;
}

export interface StepResult {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

export interface MissionDefinition {
    name: string;
    trigger: string;
    version: string;
    execute: (context: MissionContext) => Promise<StepResult>;
}

// Step 1 outputs
export interface ConversationIntelligence {
    aiSummary: string;
    intent: Intent;
    urgency: number; // V2: 0.0 to 1.0
    entities: ExtractedEntities;
    suggestedActions: SuggestedAction[];
    leadCandidateScore: number;
    projectSignals: ProjectSignals; // V2
}

export interface ProjectSignals {
    isNewProject: boolean;
    stageChangeDetected: string | null;
}

export type Intent =
    | 'project_inquiry'
    | 'payment_query'
    | 'scope_clarification'
    | 'follow_up'
    | 'scheduling'
    | 'feedback'
    | 'casual_chat'
    | 'spam'
    | 'introduction'
    | 'complaint'
    | 'unknown';

export interface ExtractedEntities {
    budget?: { amount: number | null; currency: string };
    timeline?: string | null;
    deliverables?: string[];
    dates?: string[];
    paymentTerms?: string | null;
    projectType?: string;
    contactInfo?: { email?: string; phone?: string };
}

export type SuggestedAction =
    | 'create_lead'
    | 'draft_proposal'
    | 'ask_clarifying_question'
    | 'create_project'
    | 'send_invoice'
    | 'schedule_followup'
    | 'schedule_call'
    | 'escalate'
    | 'no_action'
    | 'none';

// Step 2 outputs
export type LeadPriority = 'HOT' | 'WARM' | 'COLD';

export interface LeadScoringResult {
    score: number;
    priority: LeadPriority;
    classification: string;
    signals: LeadSignals;
}

export interface LeadSignals {
    budgetPresent: boolean;
    timelinePresent: boolean;
    deliverablesListed: boolean;
    decisionMakerIdentified: boolean;
    existingClient: boolean;
    replySpeed: number;
    channelIntent: number;
    // Derived
    urgencyScore: number;
    intentIsProjectInquiry: boolean;
    messageLengthBonus: boolean;
    isRepeatClient: boolean;
}

// Step 4 outputs
export interface GeneratedReply {
    shortReply: string;
    detailedReply: string;
    confidence: number;
}
