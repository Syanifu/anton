/**
 * Step 2 — Lead Scoring (deterministic logic)
 *
 * V2: Updated weights per build plan section 2.6
 *
 * Signal weights:
 * - Budget mentioned: 0.25
 * - Timeline mentioned: 0.20
 * - Deliverables listed: 0.15
 * - Decision-maker identified: 0.15
 * - Existing client (has past projects): 0.10
 * - Reply speed (fast = high interest): 0.10
 * - Channel intent (email > WhatsApp): 0.05
 *
 * Thresholds:
 * - HOT (>= 0.85): immediate push notification
 * - WARM (0.60-0.84): suggest lead creation
 * - COLD (0.35-0.59): store context
 * - Below 0.35: no action
 */

import {
    ConversationIntelligence,
    LeadScoringResult,
    LeadPriority,
    LeadSignals,
    Channel,
} from '../types';

interface LeadScoringInput {
    intelligence: ConversationIntelligence;
    messageLength: number;
    isRepeatClient: boolean;
    channel?: Channel;
    hasExistingProjects?: boolean;
}

const WEIGHTS = {
    budgetMentioned: 0.25,
    timelineMentioned: 0.20,
    deliverablesListed: 0.15,
    decisionMakerIdentified: 0.15,
    existingClient: 0.10,
    replySpeed: 0.10,
    channelIntent: 0.05,
};

const THRESHOLDS = {
    HOT: 0.85,
    WARM: 0.60,
    COLD: 0.35,
};

function getChannelIntentScore(channel?: Channel): number {
    switch (channel) {
        case 'email': return 1.0;
        case 'slack': return 0.7;
        case 'whatsapp': return 0.5;
        case 'telegram': return 0.4;
        default: return 0.5;
    }
}

function classifyPriority(score: number): LeadPriority {
    if (score >= THRESHOLDS.HOT) return 'HOT';
    if (score >= THRESHOLDS.WARM) return 'WARM';
    return 'COLD';
}

function getClassification(score: number): string {
    if (score >= THRESHOLDS.HOT) return 'hot';
    if (score >= THRESHOLDS.WARM) return 'warm';
    if (score >= THRESHOLDS.COLD) return 'cold';
    return 'none';
}

export function computeLeadScore(input: LeadScoringInput): LeadScoringResult {
    const { intelligence, messageLength, isRepeatClient, channel, hasExistingProjects } = input;
    const { entities, intent, urgency } = intelligence;

    const channelIntentScore = getChannelIntentScore(channel);

    // Compute signals
    const signals: LeadSignals = {
        budgetPresent: !!entities.budget?.amount,
        timelinePresent: !!entities.timeline,
        deliverablesListed: (entities.deliverables?.length || 0) > 0,
        decisionMakerIdentified: intent === 'project_inquiry',
        existingClient: hasExistingProjects || isRepeatClient,
        replySpeed: urgency, // Use urgency as proxy for reply speed/interest
        channelIntent: channelIntentScore,
        // Derived / legacy
        urgencyScore: urgency,
        intentIsProjectInquiry: intent === 'project_inquiry',
        messageLengthBonus: messageLength > 40,
        isRepeatClient,
    };

    // Calculate weighted score
    let score = 0;

    if (signals.budgetPresent) score += WEIGHTS.budgetMentioned;
    if (signals.timelinePresent) score += WEIGHTS.timelineMentioned;
    if (signals.deliverablesListed) score += WEIGHTS.deliverablesListed;
    if (signals.decisionMakerIdentified) score += WEIGHTS.decisionMakerIdentified;
    if (signals.existingClient) score += WEIGHTS.existingClient;
    score += signals.replySpeed * WEIGHTS.replySpeed;
    score += signals.channelIntent * WEIGHTS.channelIntent;

    // Clamp to 1.0
    score = Math.min(score, 1.0);

    return {
        score,
        priority: classifyPriority(score),
        classification: getClassification(score),
        signals,
    };
}
