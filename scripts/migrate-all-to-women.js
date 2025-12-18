const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch, query, where } = require('firebase/firestore');
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

const OLD_IDS_MAP = {
    'A4QOu7vblhKWJpgh2XYs': 'Manteaux — Vestes',
    'CYlbI86iGz8l3hGszhZ1': 'Ensembles',
    'GkZyCaf5I1pO2uRzIyjt': 'Hauts',
    'aMhIBLLtnwCjwj0eKmA3': 'Pull',
    'v5tr9TYq0dQkxI3jqC5P': 'Robes',
    'yOo9GbtBg70CWtJvaphK': 'Chemises',
    'SahljlzwnR3zwMbcuGOl': 'Hauts' // Fallback for general 'Vêtements'
};

async function migrateAllToWomen() {
    console.log('🚀 Starting Full Migration to "Femmes" subcategories...');

    // 1. Get "Femmes" and its children
    console.log('Fetching new category structure...');
    const invalidCats = [];
    const catSnapshot = await getDocs(collection(db, 'categories'));

    let womenId = null;
    const catData = [];
    catSnapshot.forEach(doc => {
        const d = { id: doc.id, ...doc.data() };
        catData.push(d);
        if (d.name === 'Femmes' && !d.parentId) womenId = doc.id;
    });

    if (!womenId) {
        console.error('❌ CRITICAL: "Femmes" category not found.');
        process.exit(1);
    }

    // 2. Build Map: Name -> New ID (under Femmes)
    const womenSubMap = {}; // "Robes" -> ID
    catData.filter(c => c.parentId === womenId).forEach(c => {
        womenSubMap[c.name] = c.id;
    });

    console.log('Target "Femmes" subcategories:', womenSubMap);

    // 3. Scan all products to find those with OLD IDs
    console.log('Scanning products...');
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const batch = writeBatch(db);
    let count = 0;
    const errors = [];

    productsSnapshot.forEach(doc => {
        const prod = doc.data();
        const oldCatId = prod.categoryId;

        // Check if this product belongs to one of the OLD IDs
        if (OLD_IDS_MAP[oldCatId]) {
            const targetName = OLD_IDS_MAP[oldCatId];
            const newCatId = womenSubMap[targetName];

            if (newCatId) {
                console.log(`Migrating "${prod.id}" (${targetName}) -> ${newCatId}`);
                batch.update(doc.ref, { categoryId: newCatId });
                count++;
            } else {
                errors.push(`Target subcategory "${targetName}" not found in Femmes for product ${prod.id}`);
            }
        }
    });

    // 4. Commit
    if (count > 0) {
        if (count > 450) console.warn("⚠️ Warning: Batch size large (>450), committing all at once might exceed limits (500).");
        await batch.commit();
        console.log(`✅ Successfully migrated ${count} products to "Femmes" section.`);
    } else {
        console.log('✨ No products needed migration (already migrated or IDs not found).');
    }

    if (errors.length > 0) {
        console.error('⚠️ Errors encountered:', errors);
    }

    process.exit(0);
}

migrateAllToWomen().catch(console.error);
