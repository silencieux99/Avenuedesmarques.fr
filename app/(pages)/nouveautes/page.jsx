'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from "@/lib/firestore/user/read";
import { updateCarts } from "@/lib/firestore/user/write";
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function NouveautesPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);
    const { user } = mounted ? useAuth() : { user: null };
    const { data: userData } = useUser({ uid: user?.uid });

    useEffect(() => {
        const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            // Sort by create time (Newest first)
            data.sort((a, b) => (b.timestampCreate?.toMillis() || 0) - (a.timestampCreate?.toMillis() || 0));
            setProducts(data);
            setLoading(false);
        });
        return () => unsubProducts();
    }, []);

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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-24">
            <header className="border-b border-neutral-100">
                <div className="max-w-7xl mx-auto px-6 py-16 text-center">
                    <h1 className="text-3xl md:text-4xl font-light text-neutral-900 tracking-tight mb-4">
                        Nouveautés
                    </h1>
                    <p className="text-sm text-neutral-500 max-w-xl mx-auto">
                        Les dernières pièces ajoutées à notre collection.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                    <AnimatePresence mode="popLayout">
                        {products.map((product, index) => {
                            // Using price exclusively if salePrice is merged, or fallback
                            const displayPrice = product.price;
                            const isSoldOut = (product.stock || 0) <= 0;

                            return (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link href={`/products/${product.id}`} className="group block">
                                        <div className="relative aspect-[3/4] bg-neutral-50 overflow-hidden mb-4">
                                            {product.featureImageURL ? (
                                                <Image
                                                    src={product.featureImageURL}
                                                    alt={product.title}
                                                    fill
                                                    className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isSoldOut ? 'opacity-50 grayscale' : ''}`}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-300">Image</div>
                                            )}

                                            {isSoldOut && (
                                                <span className="absolute top-3 left-3 bg-neutral-900 text-white text-[10px] uppercase font-medium px-2 py-1 tracking-wider">
                                                    Épuisé
                                                </span>
                                            )}

                                            {!isSoldOut && (
                                                <button
                                                    onClick={(e) => handleQuickAdd(e, product)}
                                                    className="absolute bottom-3 right-3 w-10 h-10 bg-white border border-neutral-200 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-neutral-900 hover:text-white"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-sm font-normal text-neutral-900 line-clamp-2 md:line-clamp-1 group-hover:underline decoration-neutral-300 underline-offset-4">
                                                {product.title}
                                            </h3>
                                            <p className="text-sm font-medium text-neutral-900">
                                                {displayPrice?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                            </p>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
