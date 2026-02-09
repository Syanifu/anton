/**
 * Step 2 — Lead Scoring (deterministic logic)
 *
 * Computes lead score from weighted signals:
 * - budget_present: +0.30
 * - timeline_present: +0.20
 * - intent=project_inquiry: +0.25
 * - deliverables_defined: +0.15
 * - urgency_score * 0.10
 * - message_length>40: +0.05
 * - repeat_client: +0.10
 *
 * Classification:
 * - >= 0.85: HOT
 * - >= 0.60: WARM
 * - >= 0.35: COLD
 */

import {
    ConversationIntelligence,
    LeadScoringResult,
    LeadPriority,
    LeadSignals,
} from '../types';

interface LeadScoringInput {
    intelligence: ConversationIntelligence;
    messageLength: number;
    isRepeatClient: boolean;
}

const WEIGHTS = {
    budgetPresent: 0.30,
    timelinePresent: 0.20,
    intentIsProjectInquiry: 0.25,
    deliverablesDefiend: 0.15,
    urgencyMultiplier: 0.10,
    messageLengthBonus: 0.05,
    repeatClient: 0.10,
};

const THRESHOLDS = {
    HOT: 0.85,
    WARM: 0.60,
    COLD: 0.35,
};

function getUrgencyScore(urgency: 'high' | 'medium' | 'low'): number {
    switch (urgency) {
        case 'high':
            return 1.0;
        case 'medium':
            return 0.5;
        case 'low':
            return 0.2;
        default:
            return 0.3;
    }
}

function classifyPriority(score: number): LeadPriority {
    if (score >= THRESHOLDS.HOT) return 'HOT';
    if (score >= THRESHOLDS.WARM) return 'WARM';
    return 'COLD';
}

export function computeLeadScore(input: LeadScoringInput): LeadScoringResult {
    const { intelligence, messageLength, isRepeatClient } = input;
    const { entities, intent, urgency } = intelligence;

    // Compute signals
    const signals: LeadSignals = {
        budgetPresent: !!entities.budget,
        timelinePresent: !!entities.timeline,
        intentIsProjectInquiry: intent === 'project_inquiry',
        deliverablesDefiend: (entities.deliverables?.length || 0) > 0,
        urgencyScore: getUrgencyScore(urgency),
        messageLengthBonus: messageLength > 40,
        isRepeatClient,
    };

    // Calculate weighted score
    let score = 0;

    if (signals.budgetPresent) {
        score += WEIGHTS.budgetPresent;
    }

    if (signals.timelinePresent) {
        score += WEIGHTS.timelinePresent;
    }

    if (signals.intentIsProjectInquiry) {
        score += WEIGHTS.intentIsProjectInquiry;
    }

    if (signals.deliverablesDefiend) {
        score += WEIGHTS.deliverablesDefiend;
    }

    score += signals.urgencyScore * WEIGHTS.urgencyMultiplier;

    if (signals.messageLengthBonus) {
        score += WEIGHTS.messageLengthBonus;
    }

    if (signals.isRepeatClient) {
        score += WEIGHTS.repeatClient;
    }

    // Clamp to 1.0
    score = Math.min(score, 1.0);

    return {
        score,
        priority: classifyPriority(score),
        signals,
    };
}
