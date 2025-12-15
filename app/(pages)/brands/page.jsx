'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const brandsRef = collection(db, 'brands');
        const unsubscribe = onSnapshot(brandsRef, (snapshot) => {
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setBrands(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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

    return (
        <div className="min-h-screen bg-white pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <header className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-light text-neutral-900 mb-4 tracking-tight">
                        Nos Marques
                    </h1>
                    <p className="text-neutral-500 max-w-2xl mx-auto">
                        Découvrez notre sélection de marques prestigieuses
                    </p>
                    <p className="text-xs text-neutral-400 mt-6 uppercase tracking-widest">
                        {brands.length} marque{brands.length !== 1 ? 's' : ''}
                    </p>
                </header>

                {/* Brands Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {brands.map((brand, index) => (
                        <motion.div
                            key={brand.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link href={`/brands/${brand.slug || brand.id}`} className="group block">
                                <div className="relative aspect-square bg-neutral-50 rounded-lg overflow-hidden mb-3 border border-neutral-100 hover:border-accent transition-all duration-300">
                                    {brand.imageURL ? (
                                        <Image
                                            src={brand.imageURL}
                                            alt={brand.name}
                                            fill
                                            className="object-contain p-6 group-hover:scale-110 transition-transform duration-500"
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-2xl font-serif text-neutral-300">{brand.name?.charAt(0)}</span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-center text-sm font-medium text-neutral-900 group-hover:text-accent transition-colors">
                                    {brand.name}
                                </h3>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {brands.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-neutral-400">Aucune marque disponible</p>
                    </div>
                )}
            </div>
        </div>
    );
}
