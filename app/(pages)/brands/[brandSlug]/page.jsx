'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from "@/lib/firestore/user/read";
import { updateCarts } from "@/lib/firestore/user/write";
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';

export default function BrandProductsPage() {
    const params = useParams();
    const brandSlug = params.brandSlug;

    const [brand, setBrand] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { user } = mounted ? useAuth() : { user: null };
    const { data: userData } = useUser({ uid: user?.uid });

    // Fetch brand and products
    useEffect(() => {
        const fetchBrandAndProducts = async () => {
            try {
                // Find brand by slug
                const brandsRef = collection(db, 'brands');
                const brandsSnapshot = await getDocs(brandsRef);
                let foundBrand = null;

                brandsSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.slug === brandSlug || doc.id === brandSlug) {
                        foundBrand = { id: doc.id, ...data };
                    }
                });

                if (!foundBrand) {
                    setLoading(false);
                    return;
                }

                setBrand(foundBrand);

                // Fetch products for this brand
                const productsRef = collection(db, 'products');
                const q = query(productsRef, where('brandId', '==', foundBrand.id));

                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const data = [];
                    snapshot.forEach(doc => {
                        data.push({ id: doc.id, ...doc.data() });
                    });
                    data.sort((a, b) => (b.timestampCreate?.toMillis() || 0) - (a.timestampCreate?.toMillis() || 0));
                    setProducts(data);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error fetching brand:', error);
                setLoading(false);
            }
        };

        fetchBrandAndProducts();
    }, [brandSlug]);

    const handleQuickAdd = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user?.uid) {
            toast.error("Connectez-vous pour ajouter au panier");
            return;
        }

        try {
            const productId = product.id;
            const isAdded = userData?.carts?.find((item) => item?.id === productId);
            let newList;

            if (isAdded) {
                newList = userData?.carts?.map(item =>
                    item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                newList = [...(userData?.carts ?? []), { id: productId, quantity: 1 }];
            }

            await updateCarts({ list: newList, uid: user?.uid });
            toast.success("Ajouté au panier");
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center pt-32">
                <div className="text-center">
                    <Loader2 size={24} strokeWidth={1} className="animate-spin text-neutral-400 mx-auto mb-4" />
                    <p className="text-xs text-neutral-400 uppercase tracking-widest">Chargement</p>
                </div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center pt-32">
                <div className="text-center">
                    <p className="text-neutral-400 mb-4">Marque introuvable</p>
                    <Link href="/brands" className="text-accent hover:underline">
                        Retour aux marques
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Back Button */}
                <Link href="/brands" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-accent mb-8 transition-colors">
                    <ArrowLeft size={16} />
                    Retour aux marques
                </Link>

                {/* Brand Header */}
                <header className="text-center mb-16 pb-8 border-b border-neutral-100">
                    {brand.imageURL && (
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            <Image
                                src={brand.imageURL}
                                alt={brand.name}
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}
                    <h1 className="text-4xl md:text-5xl font-light text-neutral-900 mb-4 tracking-tight">
                        {brand.name}
                    </h1>
                    {brand.description && (
                        <p className="text-neutral-500 max-w-2xl mx-auto">
                            {brand.description}
                        </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-6 uppercase tracking-widest">
                        {products.length} produit{products.length !== 1 ? 's' : ''}
                    </p>
                </header>

                {/* Products Grid */}
                {products.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-neutral-400 mb-6">Aucun produit disponible pour cette marque</p>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
                    >
                        <AnimatePresence mode="popLayout">
                            {products.map((product, index) => {
                                const primaryImage = product.featureImageURL;
                                const isSoldOut = (product.stock || 0) <= 0;

                                return (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        <Link href={`/products/${product.id}`} className="group block">
                                            {/* Image */}
                                            <div className="relative aspect-[3/4] bg-neutral-50 overflow-hidden mb-4 rounded-lg">
                                                {primaryImage ? (
                                                    <Image
                                                        src={primaryImage}
                                                        alt={product.title}
                                                        fill
                                                        className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isSoldOut ? 'opacity-50 grayscale' : ''}`}
                                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-neutral-300 text-xs uppercase tracking-widest">Image</span>
                                                    </div>
                                                )}

                                                {/* Badges */}
                                                <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                    {product.isFeatured && (
                                                        <span className="bg-neutral-900 text-white text-[10px] uppercase font-medium px-2 py-1 tracking-wider">
                                                            En Vedette
                                                        </span>
                                                    )}
                                                    {isSoldOut && (
                                                        <span className="bg-neutral-900 text-white text-[10px] uppercase font-medium px-2 py-1 tracking-wider">
                                                            Épuisé
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Quick Add */}
                                                {!isSoldOut && (
                                                    <button
                                                        onClick={(e) => handleQuickAdd(e, product)}
                                                        className="absolute bottom-3 right-3 w-10 h-10 bg-white border border-neutral-200 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 rounded-lg"
                                                    >
                                                        <Plus size={16} strokeWidth={1.5} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="space-y-1.5">
                                                <h3 className="text-sm font-normal text-neutral-900 line-clamp-2 group-hover:underline underline-offset-4 decoration-neutral-300">
                                                    {product.title}
                                                </h3>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-medium text-neutral-900">
                                                        {product.salePrice
                                                            ? product.salePrice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                                                            : product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                                                        }
                                                    </span>
                                                    {product.salePrice && product.salePrice < product.price && (
                                                        <span className="text-xs text-neutral-400 line-through">
                                                            {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
