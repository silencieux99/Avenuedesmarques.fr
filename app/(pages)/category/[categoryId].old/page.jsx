import { ProductCard } from "@/app/components/Products";
import { getCategory } from "@/lib/firestore/categories/read_server";
import { getProductsByCategory } from "@/lib/firestore/products/read_server";

export async function generateMetadata({ params }) {
  const { categoryId } = params;
  const category = await getCategory({ id: categoryId });

  return {
    title: `${category?.name} | Category`,
    openGraph: {
      images: [category?.imageURL],
    },
  };
}

export default async function Page({ params }) {
  const { categoryId } = params;
  const category = await getCategory({ id: categoryId });
  const products = await getProductsByCategory({ categoryId: categoryId });

  return (
    <main className="min-h-screen pt-28 pb-10 px-4 md:px-8 bg-background">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8 md:mb-12 text-center space-y-4">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 uppercase tracking-wide">
            {category?.name}
          </h1>
          <div className="w-20 h-1 bg-accent mx-auto" />
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
