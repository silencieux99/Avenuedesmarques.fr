// Script to debug category structure
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEYS);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function debugCategories() {
    console.log('\n=== DEBUGGING CATEGORIES ===\n');

    // Get all categories
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Total categories: ${categories.length}\n`);

    // Get all products
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Total products: ${products.length}\n`);

    // Build category tree
    const buildPath = (category) => {
        const path = [];
        let current = category;

        while (current) {
            path.unshift(current.slug);
            current = categories.find(c => c.id === current.parentId);
        }

        return `/category/${path.join('/')}`;
    };

    // Show categories with products
    console.log('=== CATEGORIES WITH PRODUCTS ===\n');
    categories.forEach(cat => {
        const categoryProducts = products.filter(p => p.categoryId === cat.id);
        if (categoryProducts.length > 0) {
            const path = buildPath(cat);
            console.log(`✓ ${cat.name}`);
            console.log(`  ID: ${cat.id}`);
            console.log(`  Slug: ${cat.slug}`);
            console.log(`  Parent ID: ${cat.parentId || 'none'}`);
            console.log(`  Path: ${path}`);
            console.log(`  Products: ${categoryProducts.length}`);
            console.log(`  Product IDs: ${categoryProducts.map(p => p.id).join(', ')}`);
            console.log('');
        }
    });

    // Show categories without products
    console.log('\n=== CATEGORIES WITHOUT PRODUCTS ===\n');
    categories.forEach(cat => {
        const categoryProducts = products.filter(p => p.categoryId === cat.id);
        if (categoryProducts.length === 0) {
            console.log(`✗ ${cat.name} (${cat.slug}) - Parent: ${cat.parentId || 'none'}`);
        }
    });

    console.log('\n=== END DEBUG ===\n');
    process.exit(0);
}

debugCategories().catch(console.error);
