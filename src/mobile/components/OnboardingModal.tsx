import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';

type ConnectionType = 'whatsapp' | 'gmail';

interface OnboardingModalProps {
    visible: boolean;
    onConnect: (type: ConnectionType) => void;
    onSkip: () => void;
}

interface ConnectionOption {
    type: ConnectionType;
    title: string;
    description: string;
    icon: string;
}

const connectionOptions: ConnectionOption[] = [
    {
        type: 'whatsapp',
        title: 'WhatsApp Business',
        description: 'Receive and reply to client messages',
        icon: '💬',
    },
    {
        type: 'gmail',
        title: 'Gmail',
        description: 'Sync email conversations with clients',
        icon: '📧',
    },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
    visible,
    onConnect,
    onSkip,
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.handle} />

                    <Text style={styles.emoji}>🚀</Text>
                    <Text style={styles.title}>Connect Your First Account</Text>
                    <Text style={styles.subtitle}>
                        Start receiving and managing client messages in one place.
                    </Text>

                    <View style={styles.options}>
                        {connectionOptions.map((option) => (
                            <TouchableOpacity
                                key={option.type}
                                style={styles.optionCard}
                                onPress={() => onConnect(option.type)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.optionIcon}>{option.icon}</Text>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionTitle}>{option.title}</Text>
                                    <Text style={styles.optionDescription}>
                                        {option.description}
                                    </Text>
                                </View>
                                <Text style={styles.chevron}>→</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={onSkip}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.skipText}>Skip for now</Text>
                    </TouchableOpacity>

                    <Text style={styles.footnote}>
                        You can always connect more accounts later in Settings.
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 40,
        maxHeight: height * 0.75,
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 24,
    },
    emoji: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    options: {
        gap: 12,
        marginBottom: 24,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    optionIcon: {
        fontSize: 28,
        marginRight: 14,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    optionDescription: {
        fontSize: 13,
        color: '#6B7280',
    },
    chevron: {
        fontSize: 18,
        color: '#9CA3AF',
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    skipText: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
    },
    footnote: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 8,
    },
});
