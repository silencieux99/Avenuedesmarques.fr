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

        // Check for token
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error("Missing BLOB_READ_WRITE_TOKEN environment variable");
            return NextResponse.json(
                { error: 'Server configuration error: Missing Blob Token' },
                { status: 500 }
            );
        }

        // Upload to Vercel Blob
        const blob = await put(filename, file, {
            access: 'public',
            addRandomSuffix: true,
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error('Upload error details:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}

// export const runtime = 'edge';
