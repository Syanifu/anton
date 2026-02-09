/**
 * Step 5 — Notify (conditional)
 *
 * If priority == HOT, send push notification via notification-watcher.
 */

interface NotifyInput {
    userId: string;
    clientName: string;
    leadScore: number;
    summary: string;
}

const NOTIFICATION_WATCHER_ENDPOINT = process.env.NOTIFICATION_WATCHER_ENDPOINT;
const NOTIFICATION_WATCHER_API_KEY = process.env.NOTIFICATION_WATCHER_API_KEY;

export async function notifyHotLead(input: NotifyInput): Promise<void> {
    const { userId, clientName, leadScore, summary } = input;

    if (!NOTIFICATION_WATCHER_ENDPOINT || !NOTIFICATION_WATCHER_API_KEY) {
        console.warn('Notification watcher not configured, skipping notification');
        return;
    }

    const notification = {
        userId,
        type: 'hot_lead',
        title: `Hot Lead: ${clientName}`,
        body: summary,
        data: {
            leadScore,
            clientName,
            action: 'view_lead',
        },
        priority: 'high',
        timestamp: new Date().toISOString(),
    };

    try {
        const response = await fetch(NOTIFICATION_WATCHER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${NOTIFICATION_WATCHER_API_KEY}`,
            },
            body: JSON.stringify(notification),
        });

        if (!response.ok) {
            console.error(`Notification watcher error: ${response.status}`);
        }
    } catch (error) {
        // Don't fail the mission if notification fails
        console.error('Failed to send notification:', error);
    }
}
