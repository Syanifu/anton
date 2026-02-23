'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationSettings } from './useNotificationSettings';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export function useNotificationChecker() {
    const { user } = useAuth();
    const { settings, isLoaded } = useNotificationSettings();
    const lastCheckRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!user || !isLoaded || !settings.notificationsEnabled) return;

        const checkNotifications = async () => {
            const now = Date.now();
            // Prevent too frequent checks (minimum 5 minutes)
            if (now - lastCheckRef.current < 5 * 60 * 1000) return;
            lastCheckRef.current = now;

            const supabase = createSupabaseBrowserClient();

            // 1. Check Unreplied Messages
            try {
                const thresholdDate = new Date(now - settings.unrepliedMessageThreshold * 60 * 60 * 1000);

                // We need to find conversations where the last message was from a client 
                // and it's older than threshold.
                // Assuming `conversations` table has `updated_at` and `reply_pending` status.
                // Based on `route.ts` research, `conversations` has `reply_pending` boolean.
                // We'll trust that flag for now.

                const { data: unreplied } = await supabase
                    .from('conversations')
                    .select('id, clients(name), updated_at')
                    .eq('user_id', user.id)
                    .eq('reply_pending', true)
                    .lt('updated_at', thresholdDate.toISOString())
                    .limit(1);

                if (unreplied && unreplied.length > 0) {
                    // Start of Fix: unreplied[0].clients is an object or array depending on relationship.
                    // Assuming Many-to-One, it's an object. 
                    // However, Supabase types might be array if not 1:1. 
                    // Let's safe cast or check.
                    const clientData = unreplied[0].clients as any;
                    const clientName = clientData?.name || 'A client';
                    sendNotification(`Unreplied Message from ${clientName}`, `It's been over ${settings.unrepliedMessageThreshold} hours. Time to reply?`);
                }

            } catch (e) {
                console.error('Error checking message notifications', e);
            }

            // 2. Check Task Deadlines
            try {
                // Find tasks due between now and (now + threshold)
                const deadlineDate = new Date(now + settings.taskDeadlineThreshold * 60 * 60 * 1000);

                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('id, title, due_date')
                    .eq('user_id', user.id)
                    .eq('status', 'pending')
                    .lt('due_date', deadlineDate.toISOString())
                    .gt('due_date', new Date().toISOString()) // Only future tasks
                    .limit(1);

                if (tasks && tasks.length > 0) {
                    const task = tasks[0];
                    sendNotification(`Task Due Soon: ${task.title}`, `This task is due within ${settings.taskDeadlineThreshold} hours.`);
                }
            } catch (e) {
                console.error('Error checking task notifications', e);
            }
        };

        // Check immediately on mount/settings change, then interval
        checkNotifications();

        const interval = setInterval(checkNotifications, 5 * 60 * 1000); // Check every 5 mins
        return () => clearInterval(interval);

    }, [user, isLoaded, settings]);
}

function sendNotification(title: string, body: string) {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return;
    }

    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                new Notification(title, { body });
            }
        });
    }
}
