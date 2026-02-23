'use client';

import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'anton_notification_settings';

export interface NotificationSettings {
    unrepliedMessageThreshold: number; // Hours before alerting about unreplied message
    taskDeadlineThreshold: number; // Hours before task is due to alert
    notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
    unrepliedMessageThreshold: 8,
    taskDeadlineThreshold: 24,
    notificationsEnabled: true,
};

export function useNotificationSettings() {
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
            } catch (e) {
                console.error('Failed to parse notification settings', e);
            }
        }
        setIsLoaded(true);
    }, []);

    const updateSettings = (newSettings: Partial<NotificationSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    };

    return {
        settings,
        updateSettings,
        isLoaded
    };
}
