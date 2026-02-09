/**
 * Dispatcher: invoice-reminder
 * Handles invoice.overdue events
 * TODO: Implement full invoice-reminder-mission
 */

import { getSupabase } from '@/lib/supabase';
import { EventEnvelope } from '../mission';

export async function executeInvoiceReminder(payload: EventEnvelope): Promise<void> {
    const supabase = getSupabase();
    const { resource_id: invoiceId, user_id: userId } = payload;

    // Fetch invoice with client data
    const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
            *,
            clients (
                id,
                name,
                email,
                phone
            )
        `)
        .eq('id', invoiceId)
        .single();

    if (error || !invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // TODO: Implement invoice reminder logic
    // - Generate reminder message
    // - Send via appropriate channel
    // - Schedule follow-up reminders
    // - Track reminder history

    console.log(`[invoice-reminder] Processing overdue invoice ${invoiceId} for user ${userId}`);
}
