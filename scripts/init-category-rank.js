const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initRanks() {
    console.log('🔄 Fetching categories...');
    const snapshot = await getDocs(collection(db, 'categories'));
    const categories = [];
    snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() });
    });

    // Group by parentId
    const groups = {};
    categories.forEach(cat => {
        const parent = cat.parentId || 'root';
        if (!groups[parent]) groups[parent] = [];
        groups[parent].push(cat);
    });

    // Sort each group alphabetically and assign rank
    for (const parentId in groups) {
        const group = groups[parentId];
        // Sort alphabetically by name
        group.sort((a, b) => a.name.localeCompare(b.name));

        console.log(`\n📁 Processing group: ${parentId}`);

        for (let i = 0; i < group.length; i++) {
            const cat = group[i];
            console.log(`   - [${i}] ${cat.name}`);
            await updateDoc(doc(db, 'categories', cat.id), {
                rank: i
            });
        }
    }

    console.log('\n✅ All categories assigned initial ranks!');
    process.exit(0);
}

initRanks().catch(console.error);
