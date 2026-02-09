/**
 * Mission: anton-message-pipeline
 * Trigger: called by anton-mission-router on message.inserted
 *
 * Processes incoming messages through 5 sequential steps:
 * 1. Conversation Intelligence (LLM)
 * 2. Lead Scoring (deterministic)
 * 3. Create Lead (conditional)
 * 4. Generate Reply (LLM)
 * 5. Notify (conditional)
 */

import { MissionDefinition, MissionContext, StepResult } from './types';
import { runConversationIntelligence } from './steps/conversation-intelligence';
import { computeLeadScore } from './steps/lead-scoring';
import { createLead } from './steps/create-lead';
import { generateReply } from './steps/generate-reply';
import { notifyHotLead } from './steps/notify';

export const mission: MissionDefinition = {
    name: 'anton-message-pipeline',
    trigger: 'message.inserted',
    version: '1.0.0',

    async execute(context: MissionContext): Promise<StepResult> {
        const { message, conversation, client } = context.input;

        // Step 1 — Conversation Intelligence (LLM task)
        const intelligence = await runConversationIntelligence({
            messageContent: message.content,
            channel: conversation.channel,
            clientName: client.name,
            conversationHistory: context.input.conversationHistory || [],
        });

        // Step 2 — Lead Scoring (deterministic logic)
        const leadScoring = computeLeadScore({
            intelligence,
            messageLength: message.content.length,
            isRepeatClient: client.conversationCount > 1,
        });

        // Step 3 — Create Lead (conditional)
        let leadId: string | null = null;
        if (leadScoring.score >= 0.60) {
            leadId = await createLead({
                supabase: context.supabase,
                userId: context.userId,
                clientId: client.id,
                conversationId: conversation.id,
                score: leadScoring.score,
                priority: leadScoring.priority,
                intelligence,
            });
        }

        // Step 4 — Generate Reply (LLM task)
        let draftId: string | null = null;
        if (intelligence.intent !== 'casual_chat') {
            draftId = await generateReply({
                supabase: context.supabase,
                userId: context.userId,
                conversationId: conversation.id,
                clientName: client.name,
                channel: conversation.channel,
                messageContent: message.content,
                intelligence,
            });
        }

        // Step 5 — Notify (conditional)
        if (leadScoring.priority === 'HOT') {
            await notifyHotLead({
                userId: context.userId,
                clientName: client.name,
                leadScore: leadScoring.score,
                summary: intelligence.aiSummary,
            });
        }

        return {
            success: true,
            data: {
                intelligence,
                leadScoring,
                leadId,
                draftId,
            },
        };
    },
};

export default mission;
