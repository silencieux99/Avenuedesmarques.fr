"use client";

import { useProduct } from "@/lib/firestore/products/read";
import { Minus, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import toast from "react-hot-toast";

export default function Page() {
  const { cart, cartCount } = useCart();

  return (
    <main className="min-h-screen pt-28 pb-20 px-4 md:px-8 bg-background">
      <div className="max-w-[1000px] mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-widest">
            Mon Panier
          </h1>
          <p className="text-gray-500 text-sm uppercase tracking-wide">
            {cartCount > 0 ? `${cartCount} articles` : 'Votre panier est vide'}
          </p>
        </div>

        {cartCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-xl shadow-sm border border-gray-100 p-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-medium text-gray-900">Votre panier est vide</h2>
              <p className="text-gray-500">
                Il semble que vous n'ayez pas encore ajouté de produits.
              </p>
            </div>
            <a href="/" className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors">
              Continuer mes achats
            </a>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Cart Items */}
            <div className="flex-1 space-y-6">
              {cart?.map((item) => {
                return <ProductItem item={item} key={item?.id} />;
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:w-[350px] space-y-6 h-fit sticky top-32">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="font-serif text-lg font-bold uppercase tracking-wider border-b border-gray-100 pb-4">Résumé</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total</span>
                    <span>Calculé à l'étape suivante</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Livraison</span>
                    <span className="text-green-600 font-medium">Gratuite</span>
                  </div>
                </div>

                <Link href={`/checkout?type=cart`} className="block">
                  <button className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all rounded-lg">
                    Passer la commande
                  </button>
                </Link>

                <div className="space-y-2 text-xs text-gray-400 text-center">
                  <p>Paiement 100% sécurisé</p>
                  <div className="flex justify-center gap-2 grayscale opacity-70">
                    <span>Visa</span> • <span>Mastercard</span> • <span>Paypal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ProductItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: product } = useProduct({ productId: item?.id });

  const handleRemove = async () => {
    if (!confirm("Êtes-vous sûr de vouloir retirer cet article ?")) return;
    setIsRemoving(true);
    try {
      await removeFromCart(item?.id);
      toast.success("Produit retiré du panier");
    } catch (error) {
      toast.error(error?.message);
    }
    setIsRemoving(false);
  };

  const handleUpdate = async (quantity) => {
    if (quantity < 1) return;
    setIsUpdating(true);
    try {
      await updateQuantity(item?.id, quantity);
    } catch (error) {
      toast.error(error?.message);
    }
    setIsUpdating(false);
  };

  return (
    <div className="flex gap-4 md:gap-6 items-start bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="h-24 w-24 md:h-32 md:w-32 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
        <img
          className="w-full h-full object-cover"
          src={product?.featureImageURL}
          alt={product?.title}
        />
      </div>

      <div className="flex flex-col justify-between flex-grow h-24 md:h-32 py-1">
        <div className="space-y-1">
          <h1 className="text-sm md:text-base font-serif font-bold text-gray-900 line-clamp-2">
            {product?.title}
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-gray-900">{product?.salePrice} €</span>
            {product?.price > product?.salePrice && (
              <span className="line-through text-xs text-gray-400">
                {product?.price} €
              </span>
            )}
            {product?.price > product?.salePrice && (
              <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold uppercase">
                Soldes
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/50">
            <button
              onClick={() => handleUpdate(item?.quantity - 1)}
              disabled={isUpdating || item?.quantity <= 1}
              className="p-2 text-gray-500 hover:text-black hover:bg-white rounded-l-lg transition-all disabled:opacity-50"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item?.quantity}</span>
            <button
              onClick={() => handleUpdate(item?.quantity + 1)}
              disabled={isUpdating}
              className="p-2 text-gray-500 hover:text-black hover:bg-white rounded-r-lg transition-all disabled:opacity-50"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Retirer du panier"
          >
            {isRemoving ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <X size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
