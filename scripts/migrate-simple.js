require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, Timestamp } = require('firebase/firestore');

// Amirat Modestie Firebase Config
const amiratConfig = {
    apiKey: "AIzaSyDL1Qiz27OqtN3zUaIRYYwEFa4LnLvvo_w",
    authDomain: "amirat-modestie.firebaseapp.com",
    projectId: "amirat-modestie",
    storageBucket: "amirat-modestie.appspot.com",
    messagingSenderId: "808581399266",
    appId: "1:808581399266:web:5efc7ece1e755f445414bb"
};

// Avenue des Marques Firebase Config (from env)
const avenueConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize both apps
const amiratApp = initializeApp(amiratConfig, 'amirat');
const avenueApp = initializeApp(avenueConfig, 'avenue');

const amiratDb = getFirestore(amiratApp);
const avenueDb = getFirestore(avenueApp);

const categoryMapping = {};
const brandMapping = {};

function generateSlug(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function migrateCategories() {
    console.log('🔄 Migrating categories...');

    const categoriesSnapshot = await getDocs(collection(amiratDb, 'categories'));
    const categories = [];

    categoriesSnapshot.forEach(docSnap => {
        categories.push({ id: docSnap.id, ...docSnap.data() });
    });

    console.log(`Found ${categories.length} categories`);

    // Sort: parents first, then children
    const rootCategories = categories.filter(cat => !cat.parentId);
    const childCategories = categories.filter(cat => cat.parentId);

    // Migrate root categories
    for (const category of rootCategories) {
        const newId = doc(collection(avenueDb, 'categories')).id;
        categoryMapping[category.id] = newId;

        const newCategory = {
            id: newId,
            name: category.nom || category.name || 'Sans nom',
            slug: category.slug || generateSlug(category.nom || category.name),
            imageURL: category.imageURL || '',
            parentId: null,
            timestampCreate: Timestamp.now(),
        };

        await setDoc(doc(avenueDb, 'categories', newId), newCategory);
        console.log(`✅ ${newCategory.name}`);
    }

    // Migrate child categories
    for (const category of childCategories) {
        const newId = doc(collection(avenueDb, 'categories')).id;
        categoryMapping[category.id] = newId;

        const newParentId = categoryMapping[category.parentId] || null;

        const newCategory = {
            id: newId,
            name: category.nom || category.name || 'Sans nom',
            slug: category.slug || generateSlug(category.nom || category.name),
            imageURL: category.imageURL || '',
            parentId: newParentId,
            timestampCreate: Timestamp.now(),
        };

        await setDoc(doc(avenueDb, 'categories', newId), newCategory);
        console.log(`✅ ${newCategory.name} (child)`);
    }

    console.log(`✅ Migrated ${categories.length} categories\n`);
}

async function migrateBrands() {
    console.log('🔄 Migrating brands...');

    try {
        const brandsSnapshot = await getDocs(collection(amiratDb, 'brands'));

        if (brandsSnapshot.empty) {
            console.log('ℹ️  No brands collection found\n');
            return;
        }

        let count = 0;
        for (const docSnap of brandsSnapshot.docs) {
            const brand = docSnap.data();
            const newId = doc(collection(avenueDb, 'brands')).id;
            brandMapping[docSnap.id] = newId;

            const newBrand = {
                id: newId,
                name: brand.name || brand.nom || 'Sans nom',
                slug: generateSlug(brand.name || brand.nom),
                imageURL: brand.imageURL || '',
                description: brand.description || '',
                timestampCreate: Timestamp.now(),
            };

            await setDoc(doc(avenueDb, 'brands', newId), newBrand);
            console.log(`✅ ${newBrand.name}`);
            count++;
        }

        console.log(`✅ Migrated ${count} brands\n`);
    } catch (error) {
        console.log(`ℹ️  Brands migration skipped: ${error.message}\n`);
    }
}

async function migrateProducts() {
    console.log('🔄 Migrating products...');

    const productsSnapshot = await getDocs(collection(amiratDb, 'products'));
    let migrated = 0;
    let skipped = 0;

    for (const docSnap of productsSnapshot.docs) {
        const product = docSnap.data();

        // Skip unpublished
        if (product.status && product.status !== 'published') {
            skipped++;
            continue;
        }

        const newId = doc(collection(avenueDb, 'products')).id;

        // Map category
        let newCategoryId = null;
        if (product.categoryIds && product.categoryIds.length > 0) {
            newCategoryId = categoryMapping[product.categoryIds[0]] || null;
        } else if (product.categoryId) {
            newCategoryId = categoryMapping[product.categoryId] || null;
        }

        // Find or create brand
        let newBrandId = null;
        if (product.brand) {
            const brandsSnapshot = await getDocs(collection(avenueDb, 'brands'));
            const existingBrand = brandsSnapshot.docs.find(d =>
                d.data().name?.toLowerCase() === product.brand?.toLowerCase()
            );

            if (existingBrand) {
                newBrandId = existingBrand.id;
            } else {
                newBrandId = doc(collection(avenueDb, 'brands')).id;
                await setDoc(doc(avenueDb, 'brands', newBrandId), {
                    id: newBrandId,
                    name: product.brand,
                    slug: generateSlug(product.brand),
                    imageURL: '',
                    timestampCreate: Timestamp.now(),
                });
                console.log(`  📦 Created brand: ${product.brand}`);
            }
        }

        // Handle images
        let featureImageURL = '';
        let imageList = [];

        if (product.images && Array.isArray(product.images)) {
            const primaryImage = product.images.find(img => img.isPrimary);
            featureImageURL = primaryImage?.url || product.images[0]?.url || '';
            imageList = product.images
                .filter(img => !img.isPrimary && img.url)
                .map(img => img.url);
        } else if (product.imageURL) {
            featureImageURL = product.imageURL;
        }

        const newProduct = {
            id: newId,
            title: product.name || product.titre || 'Sans titre',
            slug: product.slug || generateSlug(product.name || product.titre),
            shortDescription: (product.description || '').substring(0, 200),
            description: product.description || '',
            price: product.price || product.prix || 0,
            salePrice: product.prixBarre || product.salePrice || null,
            stock: product.quantity || product.stock || 0,
            categoryId: newCategoryId,
            brandId: newBrandId,
            featureImageURL: featureImageURL,
            imageList: imageList,
            isFeatured: product.isNewProduct || product.isFeatured || false,
            showInHero: false,
            timestampCreate: Timestamp.now(),
        };

        await setDoc(doc(avenueDb, 'products', newId), newProduct);
        migrated++;
        console.log(`✅ ${newProduct.title} (${migrated})`);
    }

    console.log(`\n✅ Migrated ${migrated} products, skipped ${skipped}\n`);
}

async function runMigration() {
    try {
        console.log('🚀 Starting migration from Amirat Modestie to Avenue des Marques\n');

        await migrateCategories();
        await migrateBrands();
        await migrateProducts();

        console.log('🎉 Migration completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   Categories: ${Object.keys(categoryMapping).length}`);
        console.log(`   Brands: ${Object.keys(brandMapping).length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    console.log('\n🚀 Migration will start in 3 seconds...\n');

    setTimeout(() => {
        runMigration();
    }, 3000);
}

module.exports = { runMigration };
