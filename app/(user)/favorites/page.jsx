"use client";

import { ProductCard } from "@/app/components/Products";
import { useAuth } from "@/contexts/AuthContext";
import { useProduct } from "@/lib/firestore/products/read";
import { useUser } from "@/lib/firestore/user/read";
import { CircularProgress } from "@nextui-org/react";

export default function Page() {
  const { user } = useAuth();
  const { data, isLoading } = useUser({ uid: user?.uid });
  if (isLoading) {
    return (
      <div className="p-10 flex w-full justify-center">
        <CircularProgress />
      </div>
    );
  }
  return (
    <main className="min-h-screen pt-28 pb-20 px-4 md:px-8 bg-background">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-10 text-center space-y-2">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-widest">
            Mes Favoris
          </h1>
          <p className="text-gray-500 text-sm uppercase tracking-wide">
            Retrouvez vos coups de cœur
          </p>
        </div>

        {(!data?.favorites || data?.favorites?.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-medium text-gray-900">votre liste est vide</h2>
              <p className="text-gray-500 max-w-sm mx-auto">
                Sauvegardez vos articles préférés pour les retrouver facilement plus tard.
              </p>
            </div>
            <a href="/" className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors">
              Découvrir la collection
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {data?.favorites?.map((productId) => {
              return <ProductItem productId={productId} key={productId} />;
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function ProductItem({ productId }) {
  const { data: product } = useProduct({ productId: productId });
  return <ProductCard product={product} />;
}
