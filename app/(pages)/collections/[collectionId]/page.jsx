import { ProductCard } from "@/app/components/Products";
import { getCollection } from "@/lib/firestore/collections/read_server";
import { getProduct } from "@/lib/firestore/products/read_server";

export async function generateMetadata({ params }) {
  const { collectionId } = params;
  const collection = await getCollection({ id: collectionId });

  return {
    title: `${collection?.title} | Collection`,
    description: collection?.subTitle ?? "",
    openGraph: {
      images: [collection?.imageURL],
    },
  };
}

export default async function Page({ params }) {
  const { collectionId } = params;
  const collection = await getCollection({ id: collectionId });
  return (
    <main className="flex justify-center p-5 md:px-10 md:py-5 w-full">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="mb-16 md:mb-24 flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-xl">
            <img
              className="w-full h-full object-cover"
              src={collection?.imageURL}
              alt={collection?.title}
            />
          </div>

          <div className="space-y-4 max-w-2xl">
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              {collection.title}
            </h1>
            <div className="w-24 h-1 bg-accent mx-auto"></div>
            <p className="text-gray-500 text-lg md:text-xl font-light italic">
              "{collection.subTitle}"
            </p>
          </div>
        </div>

        {collection?.products?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
            {collection?.products?.map((productId) => {
              return <Product productId={productId} key={productId} />;
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <p className="text-xl text-gray-400 font-serif">
              Cette collection est actuellement vide.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

async function Product({ productId }) {
  const product = await getProduct({ id: productId });
  return <ProductCard product={product} />;
}
