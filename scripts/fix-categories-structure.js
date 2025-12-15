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

async function fixCategories() {
    console.log('🔄 Fetching categories to fix structure...');
    const snapshot = await getDocs(collection(db, 'categories'));
    const categories = [];
    snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() });
    });

    // 1. Find "Vêtements"
    const vetements = categories.find(c => c.name === 'Vêtements' || c.name === 'Vêtement' || c.slug === 'vtements');

    if (!vetements) {
        console.error('❌ Could not find "Vêtements" category. Aborting.');
        return;
    }

    console.log(`✅ Target Parent: ${vetements.name} (ID: ${vetements.id})`);

    // 2. Identify categories to move
    const categoriesToMove = [
        'Robes',
        'Chemises',
        'Pull',
        'Hauts',
        'Manteaux — Vestes',
        'Ensembles',
        'Jupes',
        'Pantalons',
        'Vestes',
        'Abayas'
    ];

    for (const catName of categoriesToMove) {
        const cat = categories.find(c => c.name.toLowerCase().includes(catName.toLowerCase()) && c.id !== vetements.id);
        if (cat && !cat.parentId) { // Only move if currently root
            console.log(`   📦 Moving "${cat.name}" into "Vêtements"...`);
            await updateDoc(doc(db, 'categories', cat.id), {
                parentId: vetements.id
            });
        }
    }

    // 3. Fix "Louis Vuitton" with slug "sacs-mains" -> Rename to "Sacs à main"
    const fakeLV = categories.find(c => c.name === 'Louis Vuitton' && c.slug === 'sacs-mains');
    if (fakeLV) {
        console.log(`   ✏️ Renaming accidental "Louis Vuitton" (slug: sacs-mains) back to "Sacs à main"...`);
        await updateDoc(doc(db, 'categories', fakeLV.id), {
            name: 'Sacs à main'
        });
    }

    // 4. Fix "Parfums" slug if it starts with dash
    const parfums = categories.find(c => c.slug === '-parfums-');
    if (parfums) {
        console.log(`   ✏️ Fixing "Parfums" slug...`);
        await updateDoc(doc(db, 'categories', parfums.id), {
            slug: 'parfums'
        });
    }

    console.log('🎉 Category structure fix completed!');
    process.exit(0);
}

fixCategories().catch(console.error);
