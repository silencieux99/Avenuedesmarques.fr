"use client";

import { useAuth } from "@/contexts/AuthContext";
import { CircularProgress } from "@nextui-org/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export default function Layout({ children }) {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const productId = searchParams.get("productId");

  const { user } = useAuth();
  const { cart, cartCount } = useCart();

  // Only check cart for cart-type checkout
  if (type === "cart" && cartCount === 0) {
    return (
      <div className="h-screen w-full flex flex-col gap-3 justify-center items-center">
        <h2 className="text-xl font-medium">Votre panier est vide</h2>
        <Link href="/" className="text-white bg-black px-6 py-3 text-sm rounded-lg hover:bg-gray-800 transition-colors">
          Continuer vos achats
        </Link>
      </div>
    );
  }

  if (type === "buynow" && !productId) {
    return (
      <div className="h-screen w-full flex flex-col gap-3 justify-center items-center">
        <h2 className="text-xl font-medium">Produit non trouvé !</h2>
        <Link href="/" className="text-white bg-black px-6 py-3 text-sm rounded-lg hover:bg-gray-800 transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
