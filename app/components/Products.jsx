import Link from "next/link";
import FavoriteButton from "./FavoriteButton";
import AuthContextProvider from "@/contexts/AuthContext";
import AddToCartButton from "./AddToCartButton";
import { getProductReviewCounts } from "@/lib/firestore/products/count/read";
import { Suspense } from "react";
import MyRating from "./MyRating";

export default function ProductsGridView({ products }) {
  return (
    <section className="w-full flex justify-center py-10 md:py-20">
      <div className="flex flex-col gap-10 max-w-[1440px] px-4 w-full">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-center font-serif text-3xl md:text-4xl text-primary font-bold tracking-wide uppercase">
            Nos Créations
          </h1>
          <div className="h-0.5 w-16 bg-accent" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products?.map((item) => {
            return <ProductCard product={item} key={item?.id} />;
          })}
        </div>
      </div>
    </section>
  );
}

export function ProductCard({ product }) {
  return (
    <div className="group flex flex-col gap-3 relative">
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100">
        <Link href={`/products/${product?.id}`}>
          <img
            src={product?.featureImageURL}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt={product?.title}
          />
        </Link>

        {/* Badges / Overlay Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <AuthContextProvider>
            <FavoriteButton productId={product?.id} />
          </AuthContextProvider>
        </div>

        {product?.stock <= (product?.orders ?? 0) && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-red-500">Épuisé</span>
          </div>
        )}

        {/* Hover Add to Cart */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <AuthContextProvider>
            <AddToCartButton productId={product?.id} type="large" />
          </AuthContextProvider>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-center items-center">
        <Link href={`/products/${product?.id}`}>
          <h2 className="font-medium text-primary text-sm uppercase tracking-wide hover:text-accent transition-colors">
            {product?.title}
          </h2>
        </Link>
        <div className="flex items-center gap-2 text-sm font-light">
          <span className="text-primary">
            {product?.price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      </div>
    </div>
  );
}

// Keeping RatingReview if needed, but visually hidden for minimal look unless requested
async function RatingReview({ product }) {
  const counts = await getProductReviewCounts({ productId: product?.id });
  return (
    <div className="flex gap-1 items-center">
      <MyRating value={counts?.averageRating ?? 0} />
      <span className="text-xs text-gray-400">({counts?.totalReviews})</span>
    </div>
  );
}
