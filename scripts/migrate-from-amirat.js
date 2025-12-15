// Migration script from Amirat Modestie to Avenue des Marques
// This script migrates categories and products between Firebase projects

const admin = require('firebase-admin');

// Source: Amirat Modestie
const sourceServiceAccount = {
    // Vous devrez fournir les credentials d'Amirat Modestie
    // Pour l'instant, je vais créer un placeholder
};

// Target: Avenue des Marques
const targetServiceAccount = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEYS || '{}');

// Initialize Firebase Admin for source (Amirat)
const sourceApp = admin.initializeApp({
    credential: admin.credential.cert(sourceServiceAccount),
    databaseURL: "https://amirat-modestie.firebaseio.com" // À ajuster
}, 'source');

// Initialize Firebase Admin for target (Avenue)
const targetApp = admin.initializeApp({
    credential: admin.credential.cert(targetServiceAccount),
}, 'target');

const sourceDb = sourceApp.firestore();
const targetDb = targetApp.firestore();

// Category mapping to track old ID -> new ID
const categoryMapping = {};
const brandMapping = {};

async function migrateCategories() {
    console.log('🔄 Starting category migration...');

    const categoriesSnapshot = await sourceDb.collection('categories').get();
    const categories = [];

    categoriesSnapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Found ${categories.length} categories to migrate`);

    // Sort by parentId to ensure parents are created before children
    const rootCategories = categories.filter(cat => !cat.parentId);
    const childCategories = categories.filter(cat => cat.parentId);

    // Migrate root categories first
    for (const category of rootCategories) {
        const newId = targetDb.collection('categories').doc().id;
        categoryMapping[category.id] = newId;

        const newCategory = {
            id: newId,
            name: category.nom || category.name,
            slug: category.slug || generateSlug(category.nom || category.name),
            imageURL: category.imageURL || '',
            parentId: null,
            timestampCreate: admin.firestore.Timestamp.now(),
        };

        await targetDb.collection('categories').doc(newId).set(newCategory);
        console.log(`✅ Migrated root category: ${newCategory.name}`);
    }

    // Migrate child categories
    for (const category of childCategories) {
        const newId = targetDb.collection('categories').doc().id;
        categoryMapping[category.id] = newId;

        const newParentId = categoryMapping[category.parentId] || null;

        const newCategory = {
            id: newId,
            name: category.nom || category.name,
            slug: category.slug || generateSlug(category.nom || category.name),
            imageURL: category.imageURL || '',
            parentId: newParentId,
            timestampCreate: admin.firestore.Timestamp.now(),
        };

        await targetDb.collection('categories').doc(newId).set(newCategory);
        console.log(`✅ Migrated child category: ${newCategory.name} (parent: ${newParentId})`);
    }

    console.log('✅ Category migration completed!');
}

async function migrateBrands() {
    console.log('🔄 Starting brand migration...');

    // Check if brands collection exists in source
    const brandsSnapshot = await sourceDb.collection('brands').get();

    if (brandsSnapshot.empty) {
        console.log('ℹ️  No brands found in source database');
        return;
    }

    for (const doc of brandsSnapshot.docs) {
        const brand = doc.data();
        const newId = targetDb.collection('brands').doc().id;
        brandMapping[doc.id] = newId;

        const newBrand = {
            id: newId,
            name: brand.name || brand.nom,
            slug: generateSlug(brand.name || brand.nom),
            imageURL: brand.imageURL || '',
            description: brand.description || '',
            timestampCreate: admin.firestore.Timestamp.now(),
        };

        await targetDb.collection('brands').doc(newId).set(newBrand);
        console.log(`✅ Migrated brand: ${newBrand.name}`);
    }

    console.log('✅ Brand migration completed!');
}

async function migrateProducts() {
    console.log('🔄 Starting product migration...');

    const productsSnapshot = await sourceDb.collection('products').get();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const doc of productsSnapshot.docs) {
        const product = doc.data();

        // Skip if not published
        if (product.status !== 'published') {
            skippedCount++;
            continue;
        }

        const newId = targetDb.collection('products').doc().id;

        // Map category IDs
        let newCategoryId = null;
        if (product.categoryIds && product.categoryIds.length > 0) {
            // Take the first category (Avenue uses single category)
            newCategoryId = categoryMapping[product.categoryIds[0]] || null;
        }

        // Map brand
        let newBrandId = null;
        if (product.brand) {
            // Try to find brand by name
            const brandSnapshot = await targetDb.collection('brands')
                .where('name', '==', product.brand)
                .limit(1)
                .get();

            if (!brandSnapshot.empty) {
                newBrandId = brandSnapshot.docs[0].id;
            }
        }

        // Get primary image
        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
        const featureImageURL = primaryImage?.url || '';

        // Get additional images
        const imageList = product.images
            ?.filter(img => !img.isPrimary)
            ?.map(img => img.url)
            ?.filter(Boolean) || [];

        const newProduct = {
            id: newId,
            title: product.name,
            slug: product.slug || generateSlug(product.name),
            shortDescription: product.description?.substring(0, 200) || '',
            description: product.description || '',
            price: product.price || 0,
            salePrice: product.prixBarre || null,
            stock: product.quantity || 0,
            categoryId: newCategoryId,
            brandId: newBrandId,
            featureImageURL: featureImageURL,
            imageList: imageList,
            isFeatured: product.isNewProduct || false,
            showInHero: false,
            timestampCreate: admin.firestore.Timestamp.now(),
        };

        await targetDb.collection('products').doc(newId).set(newProduct);
        migratedCount++;
        console.log(`✅ Migrated product: ${newProduct.title} (${migratedCount})`);
    }

    console.log(`✅ Product migration completed! Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
}

function generateSlug(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function runMigration() {
    try {
        console.log('🚀 Starting migration from Amirat Modestie to Avenue des Marques...\n');

        await migrateCategories();
        console.log('\n');

        await migrateBrands();
        console.log('\n');

        await migrateProducts();
        console.log('\n');

        console.log('🎉 Migration completed successfully!');
        console.log(`\nMapped ${Object.keys(categoryMapping).length} categories`);
        console.log(`Mapped ${Object.keys(brandMapping).length} brands`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Check if this is run directly
if (require.main === module) {
    console.log('⚠️  IMPORTANT: You need to provide Amirat Modestie Firebase credentials');
    console.log('Please edit this file and add the sourceServiceAccount credentials\n');

    // Uncomment to run migration
    // runMigration();
}

module.exports = { runMigration };
