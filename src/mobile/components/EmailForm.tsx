import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Switch,
} from 'react-native';

interface EmailFormProps {
    onSubmit: (email: string, password: string | null, useMagicLink: boolean) => void;
    loading?: boolean;
    onBack?: () => void;
}

export const EmailForm: React.FC<EmailFormProps> = ({
    onSubmit,
    loading = false,
    onBack,
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [useMagicLink, setUseMagicLink] = useState(true);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (value: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(value)) {
            setEmailError('Please enter a valid email');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (value: string): boolean => {
        if (useMagicLink) return true;
        if (!value) {
            setPasswordError('Password is required');
            return false;
        }
        if (value.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleSubmit = () => {
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (isEmailValid && isPasswordValid) {
            onSubmit(email, useMagicLink ? null : password, useMagicLink);
        }
    };

    return (
        <View style={styles.container}>
            {onBack && (
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
            )}

            <Text style={styles.title}>Sign up with Email</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={[styles.input, emailError && styles.inputError]}
                    placeholder="you@example.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) validateEmail(text);
                    }}
                    onBlur={() => validateEmail(email)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Use magic link (passwordless)</Text>
                <Switch
                    value={useMagicLink}
                    onValueChange={setUseMagicLink}
                    trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
                    thumbColor={useMagicLink ? '#6366F1' : '#F3F4F6'}
                    disabled={loading}
                />
            </View>

            {!useMagicLink && (
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={[styles.input, passwordError && styles.inputError]}
                        placeholder="Min. 8 characters"
                        placeholderTextColor="#9CA3AF"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (passwordError) validatePassword(text);
                        }}
                        onBlur={() => validatePassword(password)}
                        secureTextEntry
                        editable={!loading}
                    />
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                </View>
            )}

            <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <Text style={styles.submitText}>
                        {useMagicLink ? 'Send Magic Link' : 'Create Account'}
                    </Text>
                )}
            </TouchableOpacity>

            {useMagicLink && (
                <Text style={styles.hint}>
                    We&apos;ll send you a secure link to sign in instantly.
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    backButton: {
        marginBottom: 24,
    },
    backText: {
        fontSize: 16,
        color: '#6366F1',
        fontWeight: '500',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingVertical: 8,
    },
    toggleLabel: {
        fontSize: 14,
        color: '#374151',
    },
    submitButton: {
        backgroundColor: '#6366F1',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    submitDisabled: {
        opacity: 0.6,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    hint: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 16,
    },
});
