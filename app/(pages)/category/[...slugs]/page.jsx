import { ProductCard } from "@/app/components/Products";
import { getCategoryBySlug, getCategories } from "@/lib/firestore/categories/read_server";
import { getProductsByCategoryIds } from "@/lib/firestore/products/read_server";

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

    // Fetch current category and ALL categories to build tree
    const [category, allCategories] = await Promise.all([
        getCategoryBySlug({ slug: slug }),
        getCategories()
    ]);

    if (!category) {
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

    const targetIds = [category.id, ...getDescendants(category.id)];

    const products = await getProductsByCategoryIds({ categoryIds: targetIds });

    return (
        <main className="min-h-screen pt-28 pb-10 px-4 md:px-8 bg-background">
            <div className="max-w-[1400px] mx-auto">
                <div className="mb-8 md:mb-12 text-center space-y-4">
                    <h1 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 uppercase tracking-wide">
                        {category?.name}
                    </h1>
                    <div className="w-20 h-1 bg-accent mx-auto" />
                    {/* Breadcrumbs could go here using `slugs` array */}
                </div>

                {products?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                        {products?.map((item) => (
                            <ProductCard product={item} key={item?.id} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <p className="text-xl md:text-2xl text-gray-500 font-serif">
                            Aucun produit trouvé dans cette catégorie.
                        </p>
                        <p className="text-gray-400">Revenez bientôt pour découvrir nos nouvelles collections.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
