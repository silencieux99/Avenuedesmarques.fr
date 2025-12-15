import { NextResponse } from 'next/server';
import { adminDB } from '@/lib/firebase_admin';

export async function GET() {
    try {
        const email = 'contact@avenuedesmarques.fr';
        const name = 'Admin';

        // Check if firebase admin is initialized
        if (!adminDB.collection) {
            return NextResponse.json({ error: "Firebase Admin not initialized. Check Env Vars." }, { status: 500 });
        }

        await adminDB.collection('admins').doc(email).set({
            id: email,
            email: email,
            name: name,
            imageURL: "https://ui-avatars.com/api/?name=Admin&background=random",
            role: 'super_admin', // Assuming role might be useful
            timestampCreate: new Date()
        }, { merge: true });

        return NextResponse.json({ success: true, message: `Admin ${email} added.` });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
