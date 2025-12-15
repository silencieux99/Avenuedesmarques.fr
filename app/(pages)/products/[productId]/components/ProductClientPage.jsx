'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    Star, Minus, Plus, ShoppingBag, Heart, Share2, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { useUser } from "@/lib/firestore/user/read";
import { updateCarts, updateFavorites } from "@/lib/firestore/user/write";

import {
    VerticalGallery,
    ProductDetailsAccordion,
    TrustBadges,
    StickyMobileBar,
    StockUrgency
} from '@/app/components/product/ProductComponents';

export default function ProductClientPage({ product }) {
    const { user } = useAuth();
    const { data: userData } = useUser({ uid: user?.uid });
    const router = useRouter();

    // Selection State
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState({});
    // We can add variant logic later if needed. For now assuming simple product.

    const isSoldOut = (product?.stock ?? 0) <= 0;
    const currentPrice = product?.price;

    const isInWishlist = userData?.favorites?.includes(product?.id);
    const isAddedToCart = userData?.carts?.find((item) => item?.id === product?.id);

    const handleAddToCart = async () => {
        if (!user?.uid) {
            router.push("/login");
            toast.error("Veuillez vous connecter pour ajouter au panier");
            return;
        }

        try {
            let newList;
            if (isAddedToCart) {
                // Option to remove or just update quantity? 
                // Logic in amiratshop was "Add", logic in Avenuedesmarques AddToCartButton is "Toggle".
                // Typically "Add to Cart" should add.
                // If already in cart, maybe increase quantity? 
                // Existing AddToCartButton removes it. That's weird for a product page button.
                // Use standard "Add" logic: if exists, update quantity. If not, add.

                const existingItem = userData?.carts?.find(item => item.id === product.id);
                const newQuantity = (existingItem?.quantity || 0) + quantity;

                newList = userData?.carts?.map(item =>
                    item.id === product.id ? { ...item, quantity: newQuantity } : item
                );
            } else {
                newList = [...(userData?.carts ?? []), { id: product.id, quantity: quantity }];
            }

            await updateCarts({ list: newList, uid: user?.uid });

            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-black text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4`}>
                    <div className="bg-white/20 p-2 rounded-full">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Ajouté au panier !</p>
                        <p className="text-xs text-neutral-300">{product.title}</p>
                    </div>
                </div>
            ));

        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleToggleFavorite = async () => {
        if (!user?.uid) {
            router.push("/login");
            toast.error("Veuillez vous connecter");
            return;
        }

        try {
            let newList;
            if (isInWishlist) {
                newList = userData?.favorites?.filter(id => id !== product.id) || [];
                toast.success('Retiré des favoris');
            } else {
                newList = [...(userData?.favorites ?? []), product.id];
                toast.success('Ajouté aux favoris');
            }
            await updateFavorites({ uid: user.uid, list: newList });
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center">Produit introuvable</div>;
    }

    // Transform images for Gallery
    const images = [];
    if (product.featureImageURL) images.push({ url: product.featureImageURL, id: 'main' });
    if (product.imageList) {
        product.imageList.forEach((url, idx) => images.push({ url, id: `extra_${idx}` }));
    }

    return (
        <div className="bg-white min-h-screen pt-28">
            <div className="lg:grid lg:grid-cols-[60%_1fr] min-h-screen">

                {/* LEFT COLUMN: GALLERY */}
                <div className="bg-white lg:pr-8">
                    <VerticalGallery
                        images={images}
                        productName={product.title}
                    />
                </div>

                {/* RIGHT COLUMN: STICKY INFO PANEL */}
                <div className="relative px-4 sm:px-8 py-8 lg:py-16">
                    <div className="lg:sticky lg:top-24 max-w-xl mx-auto lg:mx-0">

                        {/* Header */}
                        <div className="mb-8">
                            {product.brandId && (
                                <span className="text-xs font-bold tracking-widest uppercase text-accent mb-2 block">
                                    {/* We don't have brand name here easily unless we fetch it or pass it. 
                      For now, ignore or display generic. 
                      Actually, Product object might not have brand name populated, only ID.
                   */}
                                    MARQUE
                                </span>
                            )}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-900 mb-4 tracking-tight leading-tight">
                                {product.title}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                                <div className="flex text-accent">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                </div>
                                {/* <span className="border-b border-neutral-300 pb-px">Lire les avis (24)</span> */}
                            </div>
                        </div>

                        {/* Price & Stock */}
                        <div className="mb-8 flex items-baseline gap-4">
                            <span className="text-2xl font-medium text-neutral-900">
                                {currentPrice?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>

                        <StockUrgency stock={product.stock ?? 0} />

                        {/* Actions */}
                        <div className="border-t border-neutral-100 pt-8 mt-8 space-y-4">

                            {/* Quantity */}
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">Quantité</span>
                                <div className="flex items-center border border-neutral-200 rounded">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="p-3 hover:bg-neutral-50"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="w-8 text-center text-sm">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="p-3 hover:bg-neutral-50"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart / Wishlist */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isSoldOut}
                                    className={`
                    flex-1 py-4 px-8 text-center uppercase tracking-widest font-bold text-sm transition-all duration-300
                    ${isSoldOut
                                            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                                            : 'bg-black text-white hover:bg-accent shadow-xl hover:shadow-2xl hover:-translate-y-1'}
                  `}
                                >
                                    {isSoldOut ? 'Épuisé' : 'Ajouter au Panier'}
                                </button>
                                <button
                                    onClick={handleToggleFavorite}
                                    className="p-4 border border-neutral-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                                >
                                    <Heart size={20} fill={isInWishlist ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>

                        {/* Trust & Details */}
                        <div className="mt-12">
                            <TrustBadges />
                            <ProductDetailsAccordion description={product.description || product.shortDescription || ''} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Mobile Bar */}
            <StickyMobileBar
                price={currentPrice ?? 0}
                onAddToCart={handleAddToCart}
                productName={product.title}
                image={product.featureImageURL}
            />
        </div>
    );
}
