import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError, errorResponse } from '@/lib/supabase-server';
import { generateDocumentFile } from '@/lib/document-generator';

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;

    try {
        const body = await request.json();
        const { conversation_id, content, format } = body;

        if (!content || !format) {
            return NextResponse.json({ error: 'Missing content or format' }, { status: 400 });
        }

        // 1. Create Document Session in DB
        const { data: session, error: dbError } = await supabase
            .from('document_sessions')
            .insert({
                user_id: userId,
                conversation_id,
                content_json: content,
                format,
                version: 1
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json({ error: 'Failed to create document session' }, { status: 500 });
        }

        // 2. Generate File
        // Use session ID as filename for uniqueness
        const fileUrl = await generateDocumentFile(content, format, `${session.id}_v1`);

        return NextResponse.json({
            document_id: session.id,
            version: 1,
            file_url: fileUrl
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
