import { getProduct } from "@/lib/firestore/products/read_server";
import Photos from "./components/Photos";
import Details from "./components/Details";
import Reviews from "./components/Reviews";
import RelatedProducts from "./components/RelatedProducts";
import AddReview from "./components/AddReiveiw";
import AuthContextProvider from "@/contexts/AuthContext";

export async function generateMetadata({ params }) {
  const { productId } = params;
  const product = await getProduct({ id: productId });

  return {
    title: `${product?.title} | Avenue des Marques`,
    description: product?.shortDescription ?? "",
    openGraph: {
      images: [product?.featureImageURL],
    },
  };
}

export default async function Page({ params }) {
  const { productId } = params;
  const product = await getProduct({ id: productId });

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-white">
      <div className="max-w-[1440px] mx-auto">
        {/* Breadcrumb placeholer or similar could go here */}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20">
          <Photos
            imageList={[product?.featureImageURL, ...(product?.imageList ?? [])]}
          />
          <Details product={product} />
        </section>

        <div className="mt-20 border-t border-gray-100 pt-10">
          <AuthContextProvider>
            <div className="flex flex-col gap-10 max-w-4xl mx-auto">
              <div className="flex flex-col gap-4">
                <h2 className="font-serif text-2xl text-center">Avis Clients</h2>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3">
                    <AddReview productId={productId} />
                  </div>
                  <div className="w-full md:w-2/3">
                    <Reviews productId={productId} />
                  </div>
                </div>
              </div>
            </div>
          </AuthContextProvider>
        </div>

        <div className="mt-20">
          <h2 className="font-serif text-xl md:text-2xl mb-8 uppercase tracking-widest text-center">Vous aimerez aussi</h2>
          <RelatedProducts categoryId={product?.categoryId} />
        </div>
      </div>
    </main>
  );
}
