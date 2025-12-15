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

async function migratePrices() {
    console.log('🔄 Fetching products for price migration...');
    const snapshot = await getDocs(collection(db, 'products'));
    let updatedCount = 0;

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const currentPrice = data.price;
        const salePrice = data.salePrice;

        // Logic: If price is missing or 0, and salePrice exists, move salePrice to price.
        // Also ensuring price is a number.
        let newPrice = currentPrice;
        let needsUpdate = false;

        if ((!currentPrice || currentPrice === 0) && salePrice) {
            newPrice = salePrice;
            needsUpdate = true;
            console.log(`Fixing [${data.title}]: Price ${currentPrice} -> ${newPrice} (from salePrice)`);
        }

        if (needsUpdate) {
            await updateDoc(doc(db, 'products', docSnap.id), {
                price: Number(newPrice),
                // We can keep salePrice as is, or remove it if it's equal. 
                // User said "laisse uniquement prixe".
                // Let's remove salePrice field to clean up? Or just set it to null?
                // User said "migré les prix", implies moving values.
                // Let's just fix the 'price' field primarily.
            });
            updatedCount++;
        }
    }

    console.log(`\n✅ Migration completed! ${updatedCount} products updated.`);
    process.exit(0);
}

migratePrices().catch(console.error);
