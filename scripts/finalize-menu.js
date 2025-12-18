const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where, writeBatch } = require('firebase/firestore');
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

const TARGET_ORDER = [
    'Nouveautés', // Static
    'Femmes',
    'Hommes',
    'Enfants',
    'Sacs',
    'Accessoires',
    'Parfums',
    'Maison',
    'Collections', // Static
    'Marques' // Static
];

async function finalizeMenu() {
    console.log('✨ Finalizing Menu Order...');

    const snapshot = await getDocs(collection(db, 'categories'));
    const categories = [];
    snapshot.forEach(doc => categories.push({ id: doc.id, ...doc.data() }));

    const batch = writeBatch(db);
    let updates = 0;

    // 1. Update Ranks for Root Categories
    const roots = categories.filter(c => !c.parentId);

    for (const root of roots) {
        // Normalize name for matching (trim, lowercase check?)
        const name = root.name.trim(); // Handle ' Parfums'

        let rankIndex = TARGET_ORDER.indexOf(name);

        // Manual mapping if needed
        if (rankIndex === -1) {
            if (name === 'Parfums') rankIndex = TARGET_ORDER.indexOf('Parfums');
            // Handle the ' Parfums' typo in DB if present
            if (root.name === ' Parfums') rankIndex = TARGET_ORDER.indexOf('Parfums');
        }

        if (rankIndex !== -1) {
            // Found in target list
            // Rank = (index + 1) * 10 to allow space
            const newRank = (rankIndex + 1) * 10;
            console.log(`Setting Rank ${newRank} for "${root.name}"`);
            batch.update(doc(db, 'categories', root.id), { rank: newRank });
            updates++;
        } else {
            console.log(`⚠️ Unordered Root Category: "${root.name}" (ID: ${root.id})`);
            // Optional: Move to bottom or hide?
            // For now, give it a high rank
            batch.update(doc(db, 'categories', root.id), { rank: 999 });
            updates++;
        }
    }

    if (updates > 0) {
        await batch.commit();
        console.log('✅ Ranks updated.');
    }

    // 2. Identify and Link Products
    // We suspect some old categories (Pull, Robes, etc.) might have been deleted or left orphaned.
    // If they were deleted, products still have their IDs.
    // Use the KNOWN old IDs from logs to map to NEW categories.

    const OLD_IDS = {
        'aMhIBLLtnwCjwj0eKmA3': 'Pull', // Old Pull
        'v5tr9TYq0dQkxI3jqC5P': 'Robes', // Old Robes
        'yOo9GbtBg70CWtJvaphK': 'Chemises', // Old Chemises
        'CYlbI86iGz8l3hGszhZ1': 'Ensembles', // Old Ensembles
        'GkZyCaf5I1pO2uRzIyjt': 'Hauts', // Old Hauts
        'A4QOu7vblhKWJpgh2XYs': 'Manteaux — Vestes', // Old Manteaux
        'SahljlzwnR3zwMbcuGOl': 'Vêtements', // Old Parent
        // '1hSrellIe1uvDX7evwwG': 'Louis Vuitton' (Child of Old Vêtements) -> Move to Sacs > Louis Vuitton?
    };

    console.log('\n🔄 Migrating Products to new structure (Defaulting to "Femmes" subcategories)...');

    // Find Target Destination IDs inside "Femmes"
    const femmesCat = categories.find(c => c.name === 'Femmes');
    if (!femmesCat) {
        console.error('❌ "Femmes" category not found!');
        process.exit(1);
    }

    const femmesChildren = categories.filter(c => c.parentId === femmesCat.id);
    const subMap = {}; // Name -> ID
    femmesChildren.forEach(c => subMap[c.name] = c.id);

    // Map existing products
    // Note: We scan ALL products to be safe, or query by old categoryId?
    // Querying by old ID is faster if we assume we know them.
    // But products collection is "products".

    const prodUpdatesBatch = writeBatch(db);
    let prodCount = 0;
    const MAX_BATCH = 450;

    // Helper to process migration
    const migrateCategory = async (oldId, targetSubName) => {
        if (!oldId) return;

        let targetId = subMap[targetSubName];
        if (!targetId && targetSubName === 'ROOT') targetId = femmesCat.id; // Fallback

        if (!targetId) {
            console.warn(`Skipping ${oldId} -> ${targetSubName}: Target not found.`);
            return;
        }

        console.log(`Checking products for Old Cat ${oldId} -> New Cat ${targetSubName} (${targetId})...`);
        const q = query(collection(db, 'products'), where('categoryId', '==', oldId));
        const snaps = await getDocs(q);

        if (!snaps.empty) {
            console.log(`Found ${snaps.size} products to migrate.`);
            snaps.forEach(pDoc => {
                prodUpdatesBatch.update(pDoc.ref, { categoryId: targetId });
                prodCount++;
            });
        }
    };

    // Execute Migrations
    await migrateCategory(OLD_IDS['aMhIBLLtnwCjwj0eKmA3'], 'Pull');
    await migrateCategory(OLD_IDS['v5tr9TYq0dQkxI3jqC5P'], 'Robes');
    await migrateCategory(OLD_IDS['yOo9GbtBg70CWtJvaphK'], 'Chemises');
    await migrateCategory(OLD_IDS['CYlbI86iGz8l3hGszhZ1'], 'Ensembles');
    await migrateCategory(OLD_IDS['GkZyCaf5I1pO2uRzIyjt'], 'Hauts');
    await migrateCategory(OLD_IDS['A4QOu7vblhKWJpgh2XYs'], 'Manteaux — Vestes');

    // Fallback for generic 'Vêtements' -> Just put in 'Femmes' root or 'Hauts'?
    await migrateCategory(OLD_IDS['SahljlzwnR3zwMbcuGOl'], 'Hauts'); // Assumption

    if (prodCount > 0) {
        if (prodCount > 400) console.warn("⚠️ Batch might be too large, committing what we have...");
        await prodUpdatesBatch.commit();
        console.log(`✅ Migrated ${prodCount} products.`);
    } else {
        console.log('No orphaned products found for these IDs.');
    }

    process.exit(0);
}

finalizeMenu().catch(console.error);
