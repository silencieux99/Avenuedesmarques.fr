'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

export default function SetupAdminClient() {
    const [status, setStatus] = useState('Idle');

    useEffect(() => {
        const addAdmin = async () => {
            setStatus('Adding...');
            try {
                const email = 'contact@avenuedesmarques.fr';
                await setDoc(doc(db, 'admins', email), {
                    id: email,
                    email: email,
                    name: 'Admin',
                    imageURL: "https://ui-avatars.com/api/?name=Admin&background=random",
                    timestampCreate: Timestamp.now()
                }, { merge: true });
                setStatus('Success! Admin added.');
            } catch (err) {
                console.error(err);
                setStatus('Error: ' + err.message);
            }
        };

        addAdmin();
    }, []);

    return (
        <div className="p-10">
            <h1>Setup Admin</h1>
            <p>Status: {status}</p>
        </div>
    );
}
