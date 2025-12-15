"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useProductsByIds } from "@/lib/firestore/products/read";
import { CircularProgress } from "@nextui-org/react";
import { useSearchParams } from "next/navigation";
import Checkout from "./components/Checkout";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function Page() {
  const { user } = useAuth();
  const { cart } = useCart();

  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const productId = searchParams.get("productId");

  // Get product IDs from cart or single product for "buynow"
  const productIdsList =
    type === "buynow" ? [productId] : cart?.map((item) => item?.id);

  const {
    data: products,
    error,
    isLoading,
  } = useProductsByIds({
    idsList: productIdsList,
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!productIdsList || productIdsList?.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col gap-3 justify-center items-center">
        <h1 className="text-xl font-medium">Produits non trouvés</h1>
        <Link href="/" className="text-white bg-black px-6 py-3 text-sm rounded-lg hover:bg-gray-800 transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const productList =
    type === "buynow"
      ? [
        {
          id: productId,
          quantity: 1,
          product: products[0],
        },
      ]
      : cart?.map((item) => {
        return {
          ...item,
          product: products?.find((e) => e?.id === item?.id),
        };
      });

  return (
    <main className="min-h-screen pt-24 pb-20 bg-white">
      <div className="text-center mb-8 px-4">
        <h1 className="font-serif text-3xl font-bold uppercase tracking-widest text-gray-900">
          Validation de commande
        </h1>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">
          Dernière étape avant l'expédition
        </p>
      </div>
      <Checkout productList={productList} />
    </main>
  );
}
