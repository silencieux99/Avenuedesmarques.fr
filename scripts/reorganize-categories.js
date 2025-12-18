const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch, addDoc, query, where } = require('firebase/firestore');
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

const slugify = (text) => {
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
};

async function reorganizeCategories() {
    console.log('🔄 Starting category reorganization...');

    // 1. Find and Delete old "Vêtements" and its children
    console.log('Searching for old "Vêtements" category...');
    const catsSnapshot = await getDocs(collection(db, 'categories'));
    let vetementsId = null;
    let vetementsDoc = null;

    catsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.name === 'Vêtements' || data.name === 'Vetements' || data.name === 'Vêtement' || data.slug === 'vetements') {
            vetementsId = doc.id;
            vetementsDoc = doc;
        }
    });

    const batch = writeBatch(db);
    let batchCount = 0;

    if (vetementsId) {
        console.log(`Found "Vêtements" (ID: ${vetementsId}). Preparing deletion...`);

        // Find children
        const childrenQuery = query(collection(db, 'categories'), where('parentId', '==', vetementsId));
        const childrenSnapshot = await getDocs(childrenQuery);

        childrenSnapshot.forEach(child => {
            console.log(`- Deleting child: ${child.data().name} (${child.id})`);
            batch.delete(child.ref);
            batchCount++;
        });

        // Delete parent
        console.log(`- Deleting parent: Vêtements (${vetementsId})`);
        batch.delete(vetementsDoc.ref);
        batchCount++;
    } else {
        console.log('⚠️ "Vêtements" category not found. Proceeding to creation anyway.');
    }

    // execute delete batch if needed
    if (batchCount > 0) {
        await batch.commit();
        console.log('✅ Old categories deleted.');
    }

    // 2. Create new Structure
    const mainCategories = ['Femmes', 'Hommes', 'Enfants'];
    const subCategories = ['Chemises', 'Ensembles', 'Hauts', 'Manteaux — Vestes', 'Pull', 'Robes', 'Chaussures'];

    console.log('\nCreating new structure...');

    // Create a new batch for creation (or linear writes if simple)
    // We'll just use await addDoc for simplicity to get IDs easily

    let rank = 10; // Start ranking

    for (const mainName of mainCategories) {
        console.log(`\nCreating Parent: ${mainName}`);

        const mainSlug = slugify(mainName);
        const mainData = {
            name: mainName,
            slug: mainSlug,
            parentId: null,
            rank: rank++, // Increment rank for order
            createdAt: new Date().toISOString()
        };

        const mainRef = await addDoc(collection(db, 'categories'), mainData);
        console.log(`✅ Created ${mainName} (ID: ${mainRef.id})`);

        // Create subcategories
        for (const subName of subCategories) {
            // Unique slug: subName-parentName
            const subSlug = slugify(`${subName}-${mainName}`);

            const subData = {
                name: subName,
                slug: subSlug,
                parentId: mainRef.id,
                rank: 0, // No specific rank for subs needed yet, or alphabetical
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'categories'), subData);
            console.log(`   + Created Sub: ${subName} (Slug: ${subSlug})`);
        }
    }

    console.log('\n✨ Reorganization complete!');
    process.exit(0);
}

reorganizeCategories().catch(console.error);
