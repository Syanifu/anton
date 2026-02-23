import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError, errorResponse } from '@/lib/supabase-server';
import { generateDocumentFile } from '@/lib/document-generator';
import { getOpenAI } from '@/lib/openai';

const UPDATE_SYSTEM_PROMPT = `You are an expert document editor.
Your task is to modify the provided document JSON based on the user's instruction.
Return ONLY the modified JSON. Do not include any explanation or markdown formatting.
The JSON structure must remain consistent:
{
  "title": "...",
  "sections": [
    { "heading": "...", "body": "..." }
  ]
}`;

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);

    if (isAuthError(auth)) {
        return errorResponse(auth.error, auth.status);
    }

    const { supabase, userId } = auth;

    try {
        const body = await request.json();
        const { conversation_id, instruction } = body;

        if (!conversation_id || !instruction) {
            return NextResponse.json({ error: 'Missing conversation_id or instruction' }, { status: 400 });
        }

        // 1. Get latest document session
        const { data: currentSession, error: fetchError } = await supabase
            .from('document_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('conversation_id', conversation_id)
            .order('version', { ascending: false })
            .limit(1)
            .single();

        if (fetchError || !currentSession) {
            return NextResponse.json({ error: 'No active document found for this conversation' }, { status: 404 });
        }

        // 2. Call LLM to modify content
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: UPDATE_SYSTEM_PROMPT },
                { role: 'user', content: `Current JSON:\n${JSON.stringify(currentSession.content_json)}\n\nInstruction: ${instruction}` }
            ],
            response_format: { type: "json_object" }
        });

        const newContentString = completion.choices[0].message.content;
        let newContent;
        try {
            newContent = JSON.parse(newContentString || '{}');
        } catch (e) {
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        const newVersion = currentSession.version + 1;

        // 3. Create new session version
        const { data: newSession, error: insertError } = await supabase
            .from('document_sessions')
            .insert({
                user_id: userId,
                conversation_id,
                content_json: newContent,
                format: currentSession.format,
                version: newVersion
            })
            .select()
            .single();

        if (insertError) {
            console.error('Database error:', insertError);
            return NextResponse.json({ error: 'Failed to create new document version' }, { status: 500 });
        }

        // 4. Generate File
        const fileUrl = await generateDocumentFile(newContent, currentSession.format, `${newSession.id}_v${newVersion}`);

        return NextResponse.json({
            document_id: newSession.id,
            version: newVersion,
            file_url: fileUrl
        });

    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
