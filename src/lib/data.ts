import { Conversation, Invoice, Draft } from './types';

export const mockConversations: Conversation[] = [
    {
        id: '1',
        clientName: 'Sarah Miller',
        channel: 'whatsapp',
        lastMessage: {
            id: 'm1',
            sender: 'client',
            text: 'Hey! Are you available for a quick call regarding the redesign?',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            isRead: false,
        },
        unreadCount: 2,
        leadScore: 0.92,
        status: 'lead',
        aiSummary: 'Hot lead - ready to start project',
        messages: [
            {
                id: 'm1',
                sender: 'client',
                text: 'Hey! Are you available for a quick call regarding the redesign?',
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                isRead: false,
            },
        ],
    },
    {
        id: '2',
        clientName: 'TechCorp Inc.',
        channel: 'slack',
        lastMessage: {
            id: 'm2',
            sender: 'client',
            text: 'Can you send the invoice for last month?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            isRead: true,
        },
        unreadCount: 0,
        status: 'active',
        aiSummary: 'Invoice request - action needed',
        messages: [],
    },
    {
        id: '3',
        clientName: 'David Lee',
        channel: 'email',
        lastMessage: {
            id: 'm3',
            sender: 'client',
            text: 'Project scope looks good. Let\'s proceed with the mobile app.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            isRead: true,
        },
        unreadCount: 0,
        leadScore: 0.78,
        status: 'lead',
        aiSummary: 'Warm lead - awaiting proposal',
        messages: [],
    },
    {
        id: '4',
        clientName: 'StartupX',
        channel: 'email',
        lastMessage: {
            id: 'm4',
            sender: 'me',
            text: 'Thanks for your interest! I\'ve attached our portfolio...',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            isRead: true,
        },
        unreadCount: 0,
        leadScore: 0.65,
        status: 'lead',
        aiSummary: 'New inquiry - needs follow-up',
        messages: [],
    },
    {
        id: '5',
        clientName: 'Green Energy Co.',
        channel: 'telegram',
        lastMessage: {
            id: 'm5',
            sender: 'client',
            text: 'We\'ll get back to you next quarter about the dashboard project.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            isRead: true,
        },
        unreadCount: 0,
        status: 'idle',
        aiSummary: 'Delayed - follow up in Q2',
        messages: [],
    },
    {
        id: '6',
        clientName: 'Maria Garcia',
        channel: 'whatsapp',
        lastMessage: {
            id: 'm6',
            sender: 'client',
            text: 'Love the new designs! Quick question about the color palette...',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            isRead: false,
        },
        unreadCount: 1,
        status: 'active',
        aiSummary: 'Feedback on designs - minor revision',
        messages: [],
    },
    {
        id: '7',
        clientName: 'Old Client Ltd.',
        channel: 'email',
        lastMessage: {
            id: 'm7',
            sender: 'me',
            text: 'Just checking in - let me know if you need anything!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
            isRead: true,
        },
        unreadCount: 0,
        status: 'idle',
        aiSummary: 'No response in 2 weeks',
        messages: [],
    },
];

export const mockInvoices: Invoice[] = [
    {
        id: 'inv_001',
        clientName: 'TechCorp Inc.',
        amount: 2500,
        status: 'overdue',
        dueDate: '2024-01-15',
        platform_fee: 125,
        description: 'Website redesign - Phase 1',
        issuedDate: '2024-01-01'
    },
    {
        id: 'inv_002',
        clientName: 'Sarah Miller',
        amount: 1200,
        status: 'paid',
        dueDate: '2024-01-20',
        platform_fee: 60,
        description: 'Brand identity consultation',
        issuedDate: '2024-01-05'
    },
    {
        id: 'inv_003',
        clientName: 'David Lee',
        amount: 5000,
        status: 'sent',
        dueDate: '2024-02-01',
        platform_fee: 250,
        description: 'Mobile app development',
        issuedDate: '2024-01-18'
    },
    {
        id: 'inv_004',
        clientName: 'StartupX',
        amount: 800,
        status: 'draft',
        dueDate: '2024-02-05',
        platform_fee: 40,
        description: 'Logo design package',
        issuedDate: '2024-01-22'
    },
    {
        id: 'inv_005',
        clientName: 'Green Energy Co.',
        amount: 3200,
        status: 'paid',
        dueDate: '2024-01-10',
        platform_fee: 160,
        description: 'Dashboard UI/UX design',
        issuedDate: '2023-12-28'
    },
];

export const mockPriorityActions = [
    { id: 'pa1', title: 'Reply to Sarah', description: 'New project inquiry pending', type: 'reply' },
    { id: 'pa2', title: 'Invoice TechCorp', description: '$2,500 overdue by 3 days', type: 'reminder' },
    { id: 'pa3', title: 'Follow up with David', description: 'Contract sent 2 days ago', type: 'follow_up' },
];

export const mockDrafts: Draft[] = [
    {
        id: 'd1',
        clientName: 'Sarah Miller',
        channel: 'whatsapp',
        short: 'Sounds good, let\'s do 2pm tomorrow.',
        detailed: 'Hi Sarah! 2pm tomorrow works perfectly for me. I\'ll send over a calendar invite shortly with a Zoom link. Looking forward to discussing the redesign project with you!',
        confidence: 0.92,
        intent: 'scheduling',
        status: 'pending',
        conversationId: '1',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
        id: 'd2',
        clientName: 'TechCorp Inc.',
        channel: 'slack',
        short: 'Invoice attached, due in 14 days.',
        detailed: 'Hi team! I\'ve attached the invoice for last month\'s work ($2,500). Payment is due within 14 days. Please let me know if you need any additional details or have questions about the line items.',
        confidence: 0.88,
        intent: 'payment_query',
        status: 'pending',
        conversationId: '2',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
        id: 'd3',
        clientName: 'David Lee',
        channel: 'email',
        short: 'Great! Starting next week.',
        detailed: 'Thanks for confirming, David! I\'m excited to get started on this project. I\'ll begin work next Monday and will send you the first milestone deliverables by end of week. Let me know if you have any questions before we kick off.',
        confidence: 0.95,
        intent: 'project_inquiry',
        status: 'pending',
        conversationId: '3',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
        id: 'd4',
        clientName: 'StartupX',
        channel: 'email',
        short: 'Thanks for reaching out!',
        detailed: 'Hi there! Thanks for reaching out about your logo design needs. I\'d love to learn more about your brand vision. Could you share some examples of styles you like, and tell me about your target audience?',
        confidence: 0.78,
        intent: 'introduction',
        status: 'sent',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
        id: 'd5',
        clientName: 'Old Client Co.',
        channel: 'telegram',
        short: 'Following up on proposal.',
        detailed: 'Hi! Just wanted to follow up on the proposal I sent last week. Have you had a chance to review it? Happy to hop on a call if you have any questions.',
        confidence: 0.65,
        intent: 'follow_up',
        status: 'dismissed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    }
];
