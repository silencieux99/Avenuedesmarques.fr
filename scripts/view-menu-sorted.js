const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

async function getMenu() {
    // 1. Fetch
    const snapshot = await getDocs(collection(db, 'categories'));
    const categories = [];
    snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() });
    });

    // 2. Build Tree
    const categoryMap = {};
    const roots = [];

    categories.forEach((cat) => {
        categoryMap[cat.id] = { ...cat, submenu: [] };
    });

    categories.forEach((cat) => {
        if (cat.parentId && categoryMap[cat.parentId]) {
            categoryMap[cat.parentId].submenu.push(categoryMap[cat.id]);
        } else {
            roots.push(categoryMap[cat.id]);
        }
    });

    // 3. Sort
    const sortByRank = (a, b) => (a.rank || 0) - (b.rank || 0);
    roots.sort(sortByRank);

    Object.values(categoryMap).forEach(cat => {
        if (cat.submenu.length > 0) {
            cat.submenu.sort(sortByRank);
        }
    });

    // 4. Print
    console.log("Nouveautés"); // Static

    const printNode = (node, level = 0) => {
        const indent = "  ".repeat(level);
        console.log(`${indent}${node.name}`);
        if (node.submenu && node.submenu.length > 0) {
            node.submenu.forEach(sub => printNode(sub, level + 1));
        }
    };

    roots.forEach(root => printNode(root));

    console.log("Collections"); // Static
    console.log("Marques"); // Static

    process.exit(0);
}

getMenu().catch(console.error);
