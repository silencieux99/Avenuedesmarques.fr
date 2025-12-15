import { getCategories } from "@/lib/firestore/categories/read_server";
import { getProducts } from "@/lib/firestore/products/read_server";

export default async function DebugPage() {
    const [categories, products] = await Promise.all([
        getCategories(),
        getProducts()
    ]);

    // Build category path
    const buildPath = (category) => {
        const path = [];
        let current = category;

        while (current) {
            path.unshift(current.slug);
            current = categories.find(c => c.id === current.parentId);
        }

        return `/category/${path.join('/')}`;
    };

    // Categories with products
    const categoriesWithProducts = categories
        .map(cat => ({
            ...cat,
            path: buildPath(cat),
            productCount: products.filter(p => p.categoryId === cat.id).length
        }))
        .filter(cat => cat.productCount > 0);

    return (
        <main className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Debug: Categories & Products</h1>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Summary</h2>
                    <p>Total Categories: {categories.length}</p>
                    <p>Total Products: {products.length}</p>
                    <p>Categories with Products: {categoriesWithProducts.length}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Categories with Products</h2>
                    <div className="space-y-4">
                        {categoriesWithProducts.map(cat => (
                            <div key={cat.id} className="border-l-4 border-blue-500 pl-4 py-2">
                                <h3 className="font-bold text-lg">{cat.name}</h3>
                                <p className="text-sm text-gray-600">ID: {cat.id}</p>
                                <p className="text-sm text-gray-600">Slug: {cat.slug}</p>
                                <p className="text-sm text-gray-600">Parent ID: {cat.parentId || 'none'}</p>
                                <p className="text-sm font-medium text-blue-600">Path: {cat.path}</p>
                                <p className="text-sm text-green-600">Products: {cat.productCount}</p>
                                <a
                                    href={cat.path}
                                    className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Test Link →
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
