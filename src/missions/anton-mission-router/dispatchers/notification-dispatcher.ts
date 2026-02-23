/**
 * Dispatcher: notification-dispatcher
 * V2: Updated with priority tiers + anti-noise rules
 *
 * Priority Tiers:
 * - Critical: Invoice overdue, payment failed → Push + in-app + email
 * - Opportunity: Hot lead (score >= 0.85) → Push + in-app with quick-action
 * - Reply Prompt: Message awaiting reply past threshold → Push or in-app
 * - Project Alert: Deadline approaching, milestone due → Push + in-app
 * - Follow-up: Lead stalled > 3 days → In-app (optional push)
 * - Daily Digest: Morning briefing → In-app + email
 *
 * Anti-Noise Rules:
 * - Max 3 push notifications/day (user-configurable)
 * - Low-priority batches into daily digest
 * - Duplicate conversation notifications collapse
 * - Quiet hours always respected
 */

import { getSupabase } from '@/lib/supabase';

export type NotificationTier = 'critical' | 'opportunity' | 'reply_prompt' | 'project_alert' | 'follow_up' | 'daily_digest';

interface NotificationPayload {
    userId: string;
    tier: NotificationTier;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    entityId?: string;
    entityType?: string;
}

interface NotificationConfig {
    maxPushPerDay: number;
    quietHoursStart: number; // hour (0-23)
    quietHoursEnd: number;
}

const DEFAULT_CONFIG: NotificationConfig = {
    maxPushPerDay: 3,
    quietHoursStart: 22,
    quietHoursEnd: 7,
};

const NOTIFICATION_WATCHER_ENDPOINT = process.env.NOTIFICATION_WATCHER_ENDPOINT;
const NOTIFICATION_WATCHER_API_KEY = process.env.NOTIFICATION_WATCHER_API_KEY;

function isQuietHours(config: NotificationConfig): boolean {
    const hour = new Date().getHours();
    if (config.quietHoursStart > config.quietHoursEnd) {
        // Spans midnight (e.g. 22-7)
        return hour >= config.quietHoursStart || hour < config.quietHoursEnd;
    }
    return hour >= config.quietHoursStart && hour < config.quietHoursEnd;
}

function shouldSendPush(tier: NotificationTier, pushCountToday: number, config: NotificationConfig): boolean {
    // Critical always sends push (unless quiet hours)
    if (tier === 'critical') return !isQuietHours(config);

    // Respect max push limit
    if (pushCountToday >= config.maxPushPerDay) return false;

    // Quiet hours block non-critical pushes
    if (isQuietHours(config)) return false;

    // Tier-based push decisions
    switch (tier) {
        case 'opportunity': return true;
        case 'project_alert': return true;
        case 'reply_prompt': return true;
        case 'follow_up': return false; // In-app only by default
        case 'daily_digest': return false; // Email + in-app
        default: return false;
    }
}

export async function dispatchNotification(payload: NotificationPayload): Promise<void> {
    const supabase = getSupabase();
    const { userId, tier, title, body, data, entityId, entityType } = payload;

    // Load user notification config (or use defaults)
    const config = DEFAULT_CONFIG;

    // Check duplicate suppression: don't re-notify same entity within 1 hour
    if (entityId) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('entity_id', entityId)
            .gte('created_at', oneHourAgo);

        if (count && count > 0) return; // Duplicate suppressed
    }

    // Count today's push notifications
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count: pushCountToday } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('push_sent', true)
        .gte('created_at', startOfDay.toISOString());

    const sendPush = shouldSendPush(tier, pushCountToday || 0, config);
    const sendEmail = tier === 'critical' || tier === 'daily_digest';

    // Store in-app notification
    await supabase.from('notifications').insert({
        user_id: userId,
        tier,
        title,
        body,
        data: data || {},
        entity_id: entityId,
        entity_type: entityType,
        push_sent: sendPush,
        email_sent: sendEmail,
        read: false,
        created_at: new Date().toISOString(),
    });

    // Send push if allowed
    if (sendPush && NOTIFICATION_WATCHER_ENDPOINT && NOTIFICATION_WATCHER_API_KEY) {
        try {
            await fetch(NOTIFICATION_WATCHER_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${NOTIFICATION_WATCHER_API_KEY}`,
                },
                body: JSON.stringify({
                    userId,
                    type: tier,
                    title,
                    body,
                    data,
                    priority: tier === 'critical' ? 'high' : 'normal',
                    timestamp: new Date().toISOString(),
                }),
            });
        } catch (error) {
            console.error('Failed to send push notification:', error);
        }
    }
}
