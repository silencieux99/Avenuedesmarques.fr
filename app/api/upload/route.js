import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json(
                { error: 'Filename is required' },
                { status: 400 }
            );
        }

        // Get the file from the request body
        const file = await request.blob();

        // Upload to Vercel Blob
        const blob = await put(filename, file, {
            access: 'public',
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}

// export const runtime = 'edge';
