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

async function checkCategories() {
    console.log('Fetching categories...');
    const snapshot = await getDocs(collection(db, 'categories'));
    const categories = [];
    snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Total categories found: ${categories.length}`);

    // Create ID to Name map
    const idToName = new Map(categories.map(c => [c.id, c.name]));

    // 1. Check for "Vêtement"
    const vetement = categories.find(c => c.name.toLowerCase().includes('vetement') || c.name.toLowerCase().includes('vêtement'));
    if (vetement) {
        const parentName = vetement.parentId ? idToName.get(vetement.parentId) : 'ROOT';
        console.log(`\n🔎 DIAGNOSIS: Found "Vêtement" category: "${vetement.name}"`);
        console.log(`   - ID: ${vetement.id}`);
        console.log(`   - Parent: ${vetement.parentId || 'None'} (${parentName})`);

        if (vetement.parentId) {
            console.log(`   🚨 IT IS HIDDEN INSIDE "${parentName}"!`);
            // Auto-fix: Move to root if user wants it back
            console.log(`   💡 Moving "${vetement.name}" back to ROOT...`);
            await updateDoc(doc(db, 'categories', vetement.id), { parentId: null });
            console.log('   ✅ Moved to ROOT.');
            // Update local data for tree view
            vetement.parentId = null;
        }
    } else {
        console.log('\n❌ "Vêtement" category NOT found in database!');
    }

    // 2. List all categories tree
    const buildTree = (parentId = null, level = 0) => {
        const children = categories.filter(c => c.parentId === parentId);

        children.forEach(cat => {
            console.log(`${'  '.repeat(level)}- ${cat.name} (ID: ${cat.id}, Slug: ${cat.slug})`);
            buildTree(cat.id, level + 1);
        });
    };

    console.log('\n--- Current Category Structure ---');
    buildTree();

    // 3. Find Orphans (if any parentId doesn't exist)
    console.log('\n--- Orphan Check ---');
    const ids = new Set(categories.map(c => c.id));
    categories.forEach(c => {
        if (c.parentId && !ids.has(c.parentId)) {
            console.log(`⚠️ Orphan found: ${c.name} refers to non-existent parent ${c.parentId}. Moving to ROOT.`);
            updateDoc(doc(db, 'categories', c.id), { parentId: null });
            c.parentId = null;
        }
    });

    // 4. Check Unique Slugs
    console.log('\n--- Slug Uniqueness Check ---');
    const slugMap = new Map();
    const duplicates = [];

    for (const cat of categories) {
        // Basic normalization for slug comparison
        const normalizedSlug = cat.slug ? cat.slug.toLowerCase() : '';

        if (slugMap.has(normalizedSlug)) {
            duplicates.push(cat);
        } else {
            slugMap.set(normalizedSlug, cat.id);
        }
    }

    if (duplicates.length > 0) {
        console.log(`⚠️ Found ${duplicates.length} duplicate slugs! Fixing...`);

        for (const cat of duplicates) {
            let newSlug = cat.slug;
            let counter = 1;
            let normalizedNew = newSlug.toLowerCase();

            while (slugMap.has(normalizedNew)) {
                newSlug = `${cat.slug}-${counter}`;
                normalizedNew = newSlug.toLowerCase();
                counter++;
            }

            console.log(`Fixing ${cat.name}: ${cat.slug} -> ${newSlug}`);
            await updateDoc(doc(db, 'categories', cat.id), {
                slug: newSlug
            });
            slugMap.set(normalizedNew, cat.id);
        }
        console.log('✅ Slugs fixed.');
    } else {
        console.log('✅ All slugs are unique.');
    }

    process.exit(0);
}

checkCategories().catch(console.error);
