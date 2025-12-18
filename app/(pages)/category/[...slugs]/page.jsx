import { ProductCard } from "@/app/components/Products";
import { getCategoryBySlug, getCategoriesBySlug, getCategories } from "@/lib/firestore/categories/read_server";
import { getProductsByCategoryIds } from "@/lib/firestore/products/read_server";
import { getBrands } from "@/lib/firestore/brands/read_server";
import ProductGridWithFilters from "./components/ProductGridWithFilters";

export async function generateMetadata({ params }) {
    const { slugs } = params;
    const slug = slugs[slugs.length - 1];
    const category = await getCategoryBySlug({ slug: slug });

    return {
        title: `${category?.name || 'Catégorie'} | Avenue des Marques`,
        openGraph: {
            images: [category?.imageURL || '/default-category.jpg'],
        },
    };
}

export default async function Page({ params }) {
    const { slugs } = params;
    const slug = slugs[slugs.length - 1]; // Get the last part of the path

    // Fetch potential matches and ALL categories to build tree
    const [candidates, allCategories] = await Promise.all([
        getCategoriesBySlug({ slug: slug }),
        getCategories()
    ]);

    if (!candidates || candidates.length === 0) {
        return (
            <main className="min-h-screen pt-28 pb-10 px-4 md:px-8 bg-background flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Catégorie non trouvée</h1>
                <p>La catégorie demandée n'existe pas.</p>
            </main>
        );
    }

    // Helper to get descendant IDs recursively
    const getDescendants = (parentId) => {
        let descendants = [];
        const children = allCategories.filter(c => c.parentId === parentId);
        children.forEach(child => {
            descendants.push(child.id);
            descendants = [...descendants, ...getDescendants(child.id)];
        });
        return descendants;
    };

    let targetCategories = candidates;

    // If path has context (e.g. /category/homme/t-shirt), try to filter candidates
    if (slugs.length > 1) {
        const parentSlug = slugs[slugs.length - 2];
        const parentCategory = allCategories.find(c => c.slug === parentSlug);

        if (parentCategory) {
            const strictMatch = candidates.find(c => c.parentId === parentCategory.id);
            if (strictMatch) {
                targetCategories = [strictMatch];
            }
        }
    }

    // Collect all IDs (Target categories + their descendants)
    let allTargetIds = [];
    targetCategories.forEach(cat => {
        allTargetIds.push(cat.id);
        allTargetIds = [...allTargetIds, ...getDescendants(cat.id)];
    });

    // Deduplicate IDs
    allTargetIds = [...new Set(allTargetIds)];

    const [products, brands] = await Promise.all([
        getProductsByCategoryIds({ categoryIds: allTargetIds }),
        getBrands()
    ]);

    // Use the name of the first matched category for display
    const category = targetCategories[0];

    return (
        <main className="min-h-screen pt-28 pb-10 px-4 md:px-8 bg-background">
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-8 md:mb-12 text-center space-y-4">
                    <h1 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 uppercase tracking-wide">
                        {category?.name}
                    </h1>
                    <div className="w-20 h-1 bg-accent mx-auto" />
                </div>

                <ProductGridWithFilters
                    products={products}
                    brands={brands}
                    categoryName={category?.name}
                />
            </div>
        </main>
    );
}
