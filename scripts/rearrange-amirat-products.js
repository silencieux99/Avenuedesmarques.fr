const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// ==========================================
// 1. Amirat Modestie (Source) - Verified Working
// ==========================================
const amiratKeyBase64 = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDFZHm+eEe9PLHjx4tKnmPQd6+xeppoyVtKvX7Lv2tamfk/IjQZct0DcKBDI9PV4R5PikV5SK9ugEP1LFxafWdd3iXE4d1ttOXqNFWsvBzeB64L/MRKycc9HEiSotxuO5LzlEEk8kpmSNA2ag0n1zbc+grf3mHswpt/MOl9SVy3A7rQGZXuyP5Rh8SWkNvCcV++gsZukX2S5PJKwnTKwx7ueC/7uKeoedQU/dIwbA2XImxpLp1Jh7/lnn2oWii8GI1PsY7NOtS1xynAiMqTShC9wYpCeTROZkdOCxSJ+2XSjSpMIvoe/L6qotlI+DgilZgqS3h0EQWzJiooQuJEokm3AgMBAAECggEAE+4OIL4SODgdmer21GTjnRPIiHnhhzz1W7mASOAd3br4IHi6m+suB3/inoTKiai+H7fNRe6hz91hfyqodHZ+7kpUs+k+Kyp9oEUCdXtUytIpr4oo44g19qSZazzIVtTrBG7umOVhv6wQYb4Zb/FZ17vjRzEz3+zSOGhe2siCdPPdAoK1YwIu+nVUhLLQ/iY/Yfi3wKikWLuexNPfTljbEwqw3s1EBVYldm71yoYvBFkEaUdGwNf0PEsyQeffDLZIeMSY9v+h1ErdQdmCF3XwPMnBE3/aUDDXqR3YN8Q4dOCtrTHyccmgfXld4BM/0abm3gJYozeflsIMFebj1U5VkQKBgQDrdgZ1VxBATV4o2gcwvUM3ymZysAgLrmlIQerpH/Js/slTYDLu3M7c4iAUQbwlkkWnE14R3oA5QYgg1n3uZF+1bJIQEH4GjlGBl0kpeprMopWI0WyaqV2omRHcqZJru6O2YDiHEs1YP/gyIMD1A+Ke7yeRgTETSfjTpP4SHL6VbwKBgQDWnFvJq9FFZnUXCOU3YegcG0JeSqZ/4hXu9aqflUxdcfSU0mCCuY4mkcCGDD70VwjsZh1NAmOZ0hwRLipXVhWSZrLyPLvYQTL5zeorVKZ08PafAkmeZtElk19hhSqQbZtlsG2J//7f0QCks+Aj8OcuvYLlOYJoAiAwo5MNCyM8OQKBgQCyZKBuBIGOhk+BmfZ6qdokiddmqxHdb83abf7Bk2/DvqHf5nGQYYDk/vmY/1jCCnl1JQpPdYkmWAz//CI7HJcayGA9hZFF/EuqaGmI4Jgp1ECBAVJMN2d7VkWfLmZ98xMNGQea5tbnNsgfiotG1yO6kK0k44HAAHpiN447QMXwRwKBgGPO3gVBqhbbmpL26RtDpl4D827EywBolgjHKe4D0jsXN0dLO+UwBMM9P8tXwKOEIrtGllPtS4MLK1B2JuztNSUcLBbqVfYyBFIXCNPUD4INWrUCrFhFuvj9u/svomb/AqldTuRCMTfIDMOMgC5W6D1dl5WhlFtoua3FNSt4xY9JAoGAIC64L20+a9QJaLoTcUv0QjqRyjRVT57JGc7GUZ4FBWhHP8XgCymCRbiRy/j/4RXstZ9wb4pKk73u2l5wMQRdLf1kck12X2budWUqgCBz1Fm64orO+Rp5+L43VTBb+lma0VP+ReRoPu5qYSIlufVrPtnpiJy/gcTwolhD0NCVZ90=";
const amiratPrivateKey = `-----BEGIN PRIVATE KEY-----\n${amiratKeyBase64}\n-----END PRIVATE KEY-----\n`;

const amiratServiceAccount = {
    "type": "service_account",
    "project_id": "amirat-modestie",
    "private_key_id": "b1c0b7ed0d175f885e4633bf2fa20e69c74f739a",
    "private_key": amiratPrivateKey,
    "client_email": "firebase-adminsdk-fbsvc@amirat-modestie.iam.gserviceaccount.com",
    "client_id": "100668233683724462657",
}

let sourceDb;
try {
    const sourceApp = admin.initializeApp({
        credential: admin.credential.cert(amiratServiceAccount),
        databaseURL: "https://amirat-modestie.firebaseio.com"
    }, 'source');
    sourceDb = sourceApp.firestore();
} catch (e) {
    console.error('❌ FATAL: Amirat Init Failed:', e);
    process.exit(1);
}

// ==========================================
// 2. Avenue des Marques (Target) - Retry Logic
// ==========================================
let targetDb;

function tryInitTarget(pk, attemptName) {
    const targetServiceAccountString = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEYS;
    const targetAcc = JSON.parse(targetServiceAccountString);
    targetAcc.private_key = pk;

    try {
        const targetApp = admin.initializeApp({
            credential: admin.credential.cert(targetAcc),
        }, `target_${attemptName}`);
        return targetApp.firestore();
    } catch (e) {
        throw new Error(`[${attemptName}] ${e.message}`);
    }
}

async function initTarget() {
    console.log('🔹 Initializing Avenue des Marques...');
    const rawJSON = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEYS;
    if (!rawJSON) {
        console.error('❌ Env var NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEYS not found.');
        process.exit(1);
    }

    let originalKey;
    try {
        originalKey = JSON.parse(rawJSON).private_key;
    } catch (e) {
        console.error('❌ invalid JSON', e); process.exit(1);
    }

    // LIST OF STRATEGIES
    const strategies = [
        { name: 'Original', key: originalKey },
        { name: 'FixedNewlines', key: originalKey.replace(/\\n/g, '\n') },
        { name: 'FixedNewlines_Trimmed', key: originalKey.replace(/\\n/g, '\n').trim() },
        { name: 'Reconstructed', key: `-----BEGIN PRIVATE KEY-----\n${originalKey.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\\n/g, '').replace(/\s/g, '')}\n-----END PRIVATE KEY-----\n` }
    ];

    for (const s of strategies) {
        try {
            targetDb = tryInitTarget(s.key, s.name);
            console.log(`✅ Success with strategy: ${s.name}`);
            return;
        } catch (e) {
            console.log(`⚠️ ${e.message}`);
        }
    }

    console.error('❌ Could not initialize Avenue des Marques with any key format strategy.');
    process.exit(1);
}

// ==========================================
// MAIN LOGIC
// ==========================================
(async () => {
    await initTarget();

    console.log('🚀 Starting Product Rearrangement...');

    const amiratCategoriesSnapshot = await sourceDb.collection('categories').get();
    const amiratCatIdToName = new Map();
    amiratCategoriesSnapshot.forEach(doc => {
        const data = doc.data();
        amiratCatIdToName.set(doc.id, data.nom || data.name);
    });
    console.log(`   Found ${amiratCatIdToName.size} categories in Amirat.`);

    const avenueCategoriesSnapshot = await targetDb.collection('categories').get();
    const avenueCatNameToId = new Map();
    avenueCategoriesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.name) {
            avenueCatNameToId.set(data.name.toLowerCase().trim(), doc.id);
        }
    });

    const amiratProductsSnapshot = await sourceDb.collection('products').get();
    console.log(`   Found ${amiratProductsSnapshot.size} products in Amirat.`);

    let updatedCount = 0;
    let notFoundCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of amiratProductsSnapshot.docs) {
        const amiratProduct = doc.data();
        const slug = amiratProduct.slug;
        const title = amiratProduct.name;

        if (!slug && !title) continue;

        if (!amiratProduct.categoryIds || amiratProduct.categoryIds.length === 0) {
            skippedCount++;
            continue;
        }

        const specificCategoryId = amiratProduct.categoryIds[amiratProduct.categoryIds.length - 1];
        const specificCategoryName = amiratCatIdToName.get(specificCategoryId);

        if (!specificCategoryName) continue;

        const newCategoryId = avenueCatNameToId.get(specificCategoryName.toLowerCase().trim());

        if (!newCategoryId) continue;

        let avenueProductSnapshot = await targetDb.collection('products').where('slug', '==', slug).limit(1).get();
        if (avenueProductSnapshot.empty) {
            avenueProductSnapshot = await targetDb.collection('products').where('title', '==', title).limit(1).get();
        }

        if (avenueProductSnapshot.empty) {
            notFoundCount++;
            continue;
        }

        const avenueProductDoc = avenueProductSnapshot.docs[0];
        const avenueProductData = avenueProductDoc.data();

        if (avenueProductData.categoryId === newCategoryId) {
            skippedCount++;
            continue;
        }

        try {
            await targetDb.collection('products').doc(avenueProductDoc.id).update({
                categoryId: newCategoryId
            });
            console.log(`✅ Updated "${title}": ${avenueProductData.categoryId} -> ${newCategoryId} (${specificCategoryName})`);
            updatedCount++;
        } catch (e) {
            console.error(`❌ Error updating "${title}":`, e);
            errorCount++;
        }
    }

    console.log('\n==========================================');
    console.log('🎉 REARRANGEMENT COMPLETE');
    console.log('==========================================');
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❓ Not Found: ${notFoundCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    process.exit(0);
})();
