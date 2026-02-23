/**
 * Mission: anton-mission-router
 * Trigger: webhook
 * Description: Receives all Supabase events and dispatches to correct mission
 *
 * Routes:
 *   message.inserted  → anton-message-pipeline
 *   lead.created      → pipeline-awareness-mission
 *   invoice.inserted  → finance-awareness-mission
 *   invoice.overdue   → invoice-reminder-mission
 *   conversation.idle → followup-mission
 */

import { getSupabase } from '@/lib/supabase';

export interface EventEnvelope {
    event: string;
    resource_id: string;
    user_id: string;
    timestamp: string;
}

export interface RouterResult {
    dispatched: boolean;
    mission?: string;
    error?: string;
}

// Event to mission mapping
const EVENT_ROUTES: Record<string, string> = {
    // Existing routes
    'message.inserted': 'anton-message-pipeline',
    'lead.created': 'pipeline-awareness-mission',
    'invoice.inserted': 'finance-awareness-mission',
    'invoice.overdue': 'invoice-reminder-mission',
    'conversation.idle': 'followup-mission',
    // V2 routes
    'client.created': 'client-awareness-mission',
    'project.created': 'project-awareness-mission',
    'project.updated': 'project-awareness-mission',
    'lead.converted': 'project-creation-mission',
    'milestone.approaching': 'milestone-reminder-mission',
    'daily.digest': 'daily-digest-mission',
    'project.status_check': 'project-status-check-mission',
};

async function logToMissionLogs(
    event: string,
    mission: string | null,
    status: 'dispatched' | 'error' | 'unknown_event',
    error?: string
): Promise<void> {
    const supabase = getSupabase();

    await supabase.from('mission_logs').insert({
        event,
        mission,
        status,
        error,
        created_at: new Date().toISOString(),
    });
}

function validateEnvelope(envelope: Partial<EventEnvelope>): {
    valid: boolean;
    missing: string[];
} {
    const required: (keyof EventEnvelope)[] = ['event', 'resource_id', 'user_id', 'timestamp'];
    const missing = required.filter((field) => !envelope[field]);

    return {
        valid: missing.length === 0,
        missing,
    };
}

export async function routeEvent(envelope: Partial<EventEnvelope>): Promise<RouterResult> {
    // 1. Validate envelope
    const validation = validateEnvelope(envelope);

    if (!validation.valid) {
        const errorMsg = `Missing required fields: ${validation.missing.join(', ')}`;
        await logToMissionLogs(
            envelope.event || 'unknown',
            null,
            'error',
            errorMsg
        );
        return {
            dispatched: false,
            error: errorMsg,
        };
    }

    const { event, resource_id, user_id, timestamp } = envelope as EventEnvelope;

    // 2. Find target mission
    const targetMission = EVENT_ROUTES[event];

    if (!targetMission) {
        await logToMissionLogs(event, null, 'unknown_event', `No route for event: ${event}`);
        return {
            dispatched: false,
            error: `Unknown event type: ${event}`,
        };
    }

    // 3. Dispatch to mission
    try {
        await dispatchToMission(targetMission, {
            event,
            resource_id,
            user_id,
            timestamp,
        });

        // 4. Log success
        await logToMissionLogs(event, targetMission, 'dispatched');

        // 5. Return result
        return {
            dispatched: true,
            mission: targetMission,
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown dispatch error';
        await logToMissionLogs(event, targetMission, 'error', errorMsg);

        return {
            dispatched: false,
            mission: targetMission,
            error: errorMsg,
        };
    }
}

async function dispatchToMission(
    missionName: string,
    payload: EventEnvelope
): Promise<void> {
    // In Antigravity, this would use the mission runner
    // For now, we dynamically import and execute the mission
    switch (missionName) {
        case 'anton-message-pipeline': {
            const { executePipeline } = await import('./dispatchers/message-pipeline');
            await executePipeline(payload);
            break;
        }
        case 'pipeline-awareness-mission': {
            const { executePipelineAwareness } = await import('./dispatchers/pipeline-awareness');
            await executePipelineAwareness(payload);
            break;
        }
        case 'finance-awareness-mission': {
            const { executeFinanceAwareness } = await import('./dispatchers/finance-awareness');
            await executeFinanceAwareness(payload);
            break;
        }
        case 'invoice-reminder-mission': {
            const { executeInvoiceReminder } = await import('./dispatchers/invoice-reminder');
            await executeInvoiceReminder(payload);
            break;
        }
        case 'followup-mission': {
            const { executeFollowup } = await import('./dispatchers/followup');
            await executeFollowup(payload);
            break;
        }
        // V2 missions
        case 'project-creation-mission': {
            const { executeProjectCreation } = await import('./dispatchers/project-creation');
            await executeProjectCreation(payload);
            break;
        }
        case 'project-status-check-mission': {
            const { executeProjectStatusCheck } = await import('./dispatchers/project-status-check');
            await executeProjectStatusCheck(payload);
            break;
        }
        case 'milestone-reminder-mission': {
            const { executeMilestoneReminder } = await import('./dispatchers/milestone-reminder');
            await executeMilestoneReminder(payload);
            break;
        }
        case 'daily-digest-mission': {
            const { executeDailyDigest } = await import('./dispatchers/daily-digest');
            await executeDailyDigest(payload);
            break;
        }
        case 'client-awareness-mission':
        case 'project-awareness-mission': {
            // These are logging/awareness events — no specific dispatcher needed
            // The webhook trigger already logged the event
            break;
        }
        default:
            throw new Error(`No dispatcher for mission: ${missionName}`);
    }
}

export const mission = {
    name: 'anton-mission-router',
    trigger: 'webhook',
    version: '2.0.0',
    execute: routeEvent,
};

export default mission;
