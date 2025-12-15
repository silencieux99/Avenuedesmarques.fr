const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin (reuse the logic from rearrange script or simpler if key issues resolved)
// We'll reuse the robust logic just in case.
const serviceAccount = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEYS
    ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEYS)
    : null;

if (!serviceAccount) {
    console.error('No keys found');
    process.exit(1);
}

// Fix key if needed
if (serviceAccount.private_key.includes('\\n')) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
const db = admin.firestore();

async function debug() {
    console.log('--- Categories ---');
    const catsSnap = await db.collection('categories').get();
    const cats = [];
    catsSnap.forEach(doc => cats.push({ id: doc.id, ...doc.data() }));

    cats.forEach(c => {
        console.log(`[${c.id}] ${c.name} (slug: ${c.slug}, parentId: ${c.parentId})`);
    });

    console.log('\n--- Parent-Child check for "Vêtements" (or similar) ---');
    const vetements = cats.find(c => c.name.toLowerCase().includes('vêlement') || c.name.toLowerCase().includes('vetement') || c.name.toLowerCase().includes('vetements'));

    if (vetements) {
        console.log(`Found root: ${vetements.name} (${vetements.id})`);

        const getDescendants = (parentId) => {
            let descendants = [];
            const children = cats.filter(c => c.parentId === parentId);
            children.forEach(child => {
                descendants.push(child.id);
                descendants = [...descendants, ...getDescendants(child.id)];
            });
            return descendants;
        };

        const children = getDescendants(vetements.id);
        console.log(`Descendants of ${vetements.name}:`, children.length);
        children.forEach(id => {
            const child = cats.find(c => c.id === id);
            console.log(` - ${child.name} (${child.id})`);
        });

        console.log('\n--- Product Counts ---');
        // Check products for these IDs
        const targetIds = [vetements.id, ...children];

        // Batch query to count
        // We can't easily count all with one query if > 10, but let's just check a few
        for (const id of targetIds) {
            const pSnap = await db.collection('products').where('categoryId', '==', id).count().get();
            console.log(`Products in category "${cats.find(c => c.id === id).name}" (${id}): ${pSnap.data().count}`);
        }
    } else {
        console.log('Could not find a "Vêtements" category to test.');
    }
}

debug();
