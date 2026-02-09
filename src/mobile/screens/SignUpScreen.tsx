import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Platform,
    Linking,
    Alert,
} from 'react-native';
import { AuthButton } from '../components/AuthButton';
import { EmailForm } from '../components/EmailForm';
import { OnboardingModal } from '../components/OnboardingModal';

// Icons as simple components (replace with actual icon library like @expo/vector-icons)
const EmailIcon = () => <Text style={styles.icon}>✉️</Text>;
const GoogleIcon = () => <Text style={styles.icon}>G</Text>;
const AppleIcon = () => <Text style={[styles.icon, { color: '#FFFFFF' }]}></Text>;

interface SignUpScreenProps {
    onSignUpComplete: () => void;
}

type AuthView = 'main' | 'email';

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUpComplete }) => {
    const [view, setView] = useState<AuthView>('main');
    const [loading, setLoading] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Supabase auth functions
    const handleEmailSignUp = async (
        email: string,
        password: string | null,
        useMagicLink: boolean
    ) => {
        setLoading(true);
        try {
            // Import supabase client (adjust path based on your setup)
            // import { supabase } from '@/lib/supabase';

            if (useMagicLink) {
                // Magic link sign in
                // const { error } = await supabase.auth.signInWithOtp({ email });
                // if (error) throw error;
                Alert.alert(
                    'Check your email',
                    `We sent a magic link to ${email}. Click the link to sign in.`
                );
            } else {
                // Password sign up
                // const { data, error } = await supabase.auth.signUp({
                //     email,
                //     password: password!,
                // });
                // if (error) throw error;
                // if (data.user) await createUserRow(data.user);
                setShowOnboarding(true);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign up failed';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoadingProvider('google');
        try {
            // Supabase OAuth with Google
            // const { error } = await supabase.auth.signInWithOAuth({
            //     provider: 'google',
            //     options: {
            //         redirectTo: 'your-app-scheme://auth/callback',
            //     },
            // });
            // if (error) throw error;

            // Simulating OAuth flow
            setTimeout(() => {
                setLoadingProvider(null);
                setShowOnboarding(true);
            }, 1500);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Google sign in failed';
            Alert.alert('Error', message);
            setLoadingProvider(null);
        }
    };

    const handleAppleSignIn = async () => {
        setLoadingProvider('apple');
        try {
            // Apple Sign In with @invertase/react-native-apple-authentication
            // import { appleAuth } from '@invertase/react-native-apple-authentication';
            //
            // const credential = await appleAuth.performRequest({
            //     requestedOperation: appleAuth.Operation.LOGIN,
            //     requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            // });
            //
            // const { identityToken } = credential;
            // if (!identityToken) throw new Error('No identity token');
            //
            // const { data, error } = await supabase.auth.signInWithIdToken({
            //     provider: 'apple',
            //     token: identityToken,
            // });
            // if (error) throw error;
            // if (data.user) await createUserRow(data.user);

            // Simulating OAuth flow
            setTimeout(() => {
                setLoadingProvider(null);
                setShowOnboarding(true);
            }, 1500);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Apple sign in failed';
            Alert.alert('Error', message);
            setLoadingProvider(null);
        }
    };

    // Create user row in database after auth
    // const createUserRow = async (user: User) => {
    //     const { error } = await supabase.from('users').upsert({
    //         id: user.id,
    //         email: user.email,
    //         name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    //         default_currency: 'USD',
    //         created_at: new Date().toISOString(),
    //         updated_at: new Date().toISOString(),
    //     });
    //     if (error) console.error('Failed to create user row:', error);
    // };

    const handleConnectAccount = (type: 'whatsapp' | 'gmail') => {
        setShowOnboarding(false);
        // Navigate to account connection flow
        // router.push(`/connect/${type}`);
        onSignUpComplete();
    };

    const handleSkipOnboarding = () => {
        setShowOnboarding(false);
        onSignUpComplete();
    };

    const openPrivacyPolicy = () => {
        Linking.openURL('https://anton-gules.vercel.app/privacy');
    };

    const openTerms = () => {
        Linking.openURL('https://anton-gules.vercel.app/terms');
    };

    if (view === 'email') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <EmailForm
                    onSubmit={handleEmailSignUp}
                    loading={loading}
                    onBack={() => setView('main')}
                />
                <OnboardingModal
                    visible={showOnboarding}
                    onConnect={handleConnectAccount}
                    onSkip={handleSkipOnboarding}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>Anton</Text>
                    <Text style={styles.title}>Create your Anton account</Text>
                    <Text style={styles.subtitle}>
                        Your AI-powered assistant for freelance business
                    </Text>
                </View>

                <View style={styles.buttons}>
                    <AuthButton
                        provider="email"
                        icon={<EmailIcon />}
                        onPress={() => setView('email')}
                        loading={loadingProvider === 'email'}
                        disabled={!!loadingProvider}
                    />

                    <AuthButton
                        provider="google"
                        icon={<GoogleIcon />}
                        onPress={handleGoogleSignIn}
                        loading={loadingProvider === 'google'}
                        disabled={!!loadingProvider}
                    />

                    {Platform.OS === 'ios' && (
                        <AuthButton
                            provider="apple"
                            icon={<AppleIcon />}
                            onPress={handleAppleSignIn}
                            loading={loadingProvider === 'apple'}
                            disabled={!!loadingProvider}
                        />
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.legalText}>
                        By continuing, you agree to our{' '}
                        <Text style={styles.link} onPress={openTerms}>
                            Terms
                        </Text>{' '}
                        &{' '}
                        <Text style={styles.link} onPress={openPrivacyPolicy}>
                            Privacy
                        </Text>
                        .
                    </Text>
                </View>
            </ScrollView>

            <OnboardingModal
                visible={showOnboarding}
                onConnect={handleConnectAccount}
                onSkip={handleSkipOnboarding}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        fontSize: 32,
        fontWeight: '800',
        color: '#6366F1',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    buttons: {
        gap: 12,
    },
    footer: {
        marginTop: 'auto',
        paddingTop: 32,
    },
    legalText: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
    link: {
        color: '#6366F1',
        fontWeight: '500',
    },
    icon: {
        fontSize: 20,
    },
});

export default SignUpScreen;
