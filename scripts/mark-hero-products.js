// Script pour marquer automatiquement les premiers produits pour le Hero
require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, limit, query } = require('firebase/firestore');

const avenueConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(avenueConfig);
const db = getFirestore(app);

async function markProductsForHero() {
    console.log('🔄 Marking first 3 products for Hero display...\n');

    try {
        // Get first 3 products with images
        const productsSnapshot = await getDocs(
            query(collection(db, 'products'), limit(10))
        );

        let marked = 0;
        for (const docSnap of productsSnapshot.docs) {
            const product = docSnap.data();

            // Only mark products with images
            if (product.featureImageURL && marked < 3) {
                await updateDoc(doc(db, 'products', docSnap.id), {
                    showInHero: true
                });
                console.log(`✅ Marked for Hero: ${product.title}`);
                marked++;
            }

            if (marked >= 3) break;
        }

        console.log(`\n🎉 Marked ${marked} products for Hero display!`);
        console.log('Refresh your homepage to see the changes.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

markProductsForHero();
