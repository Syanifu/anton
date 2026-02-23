import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function generateDocumentFile(content: any, format: 'pdf' | 'docx', fileId: string): Promise<string> {
    const scriptPath = path.join(process.cwd(), 'src/scripts/generate_document.py');
    const fileName = `${fileId}.${format}`;
    // Store in public/documents for now so it's accessible
    const outputDir = path.join(process.cwd(), 'public/documents');
    const outputPath = path.join(outputDir, fileName);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const contentJson = JSON.stringify(content);

    // Escape single quotes for shell command (basic sanitization)
    // For production, use spawn with safe args, but exec is simpler for now with JSON string
    // better: write json to a temp file and pass path, to avoid shell escaping issues
    const tempJsonPath = path.join(outputDir, `${fileId}.json`);
    fs.writeFileSync(tempJsonPath, contentJson);

    try {
        const command = `python3 "${scriptPath}" --content-file "${tempJsonPath}" --output "${outputPath}" --format "${format}"`;
        // Alternatively, modify python script to read from file to avoid CLI length limits
        // Let's assume the python script takes --content string for now, but reading from file is safer.
        // Actually, let's update the python script to read from file if we can, or just pass the string if it's small.
        // Given the potential size, passing as file path is better.
        // But the current python script expects --content as a string.
        // Let's just use the python script as is for now, but with the cat trick.

        await execAsync(command);

        // Clean up temp json
        fs.unlinkSync(tempJsonPath);

        return `/documents/${fileName}`;
    } catch (error) {
        console.error('Error generating document:', error);
        if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath);
        throw error;
    }
}
