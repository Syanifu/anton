import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
} from 'react-native';

export type AuthProvider = 'email' | 'google' | 'apple';

interface AuthButtonProps {
    provider: AuthProvider;
    icon: React.ReactNode;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

const providerLabels: Record<AuthProvider, string> = {
    email: 'Continue with Email',
    google: 'Continue with Google',
    apple: 'Continue with Apple',
};

const providerColors: Record<AuthProvider, { bg: string; text: string }> = {
    email: { bg: '#6366F1', text: '#FFFFFF' },
    google: { bg: '#FFFFFF', text: '#1F2937' },
    apple: { bg: '#000000', text: '#FFFFFF' },
};

export const AuthButton: React.FC<AuthButtonProps> = ({
    provider,
    icon,
    onPress,
    loading = false,
    disabled = false,
    style,
}) => {
    const colors = providerColors[provider];
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: colors.bg },
                provider === 'google' && styles.googleBorder,
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, { color: colors.text }]}>
                        {providerLabels[provider]}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 12,
    },
    googleBorder: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.6,
    },
});
