'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Plus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from "@/lib/firestore/user/read";
import { updateCarts } from "@/lib/firestore/user/write";
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('newest');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const { user } = useAuth();
    const { data: userData } = useUser({ uid: user?.uid });

    // URL search params
    useEffect(() => {
        // Check if window is defined (client-side)
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const searchParam = urlParams.get('search');
            if (searchParam) setSearchTerm(searchParam);
        }
    }, []);

    // Fetch data
    useEffect(() => {
        const productsRef = collection(db, 'products');
        // We fetch all products (assuming reasonable count) to allow client-side filtering/sorting
        // Avenuedesmarques products might not have 'status' field, checking write.jsx it didn't enforce it but AI creator sets it.
        // We'll rely on what's available. If 'status' exists, we use it.
        // Ideally we should verify schema. AI creator sets status="published".

        // For safety, let's just fetch all likely items. If status is used, adding where clause is good.
        // But standard products might not have it. Let's try without status first or check if errors.
        // Actually, amiratshop had status. I'll include it if possible, but maybe minimal query is safer.
        // I'll just order by timestampCreate (from write.jsx).

        // const qProducts = query(productsRef, orderBy('timestampCreate', 'desc'));
        // Wait, if I use orderBy, I need an index.

        const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
            const data = [];
            snapshot.forEach(doc => {
                const d = doc.data();
                // Filter out if not published?
                // if (d.status === 'published' || !d.status) 
                data.push({ id: doc.id, ...d });
            });
            // Sort by create time client side to avoid index requirement for now
            data.sort((a, b) => (b.timestampCreate?.toMillis() || 0) - (a.timestampCreate?.toMillis() || 0));
            setProducts(data);
            setLoading(false);
        });

        const categoriesRef = collection(db, 'categories');
        // Same for categories
        const unsubCategories = onSnapshot(categoriesRef, (snapshot) => {
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCategories(data);
        });

        return () => {
            unsubProducts();
            unsubCategories();
        };
    }, []);

    // Filter and sort
    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        if (selectedCategory) {
            filtered = filtered.filter(p => p.categoryId === selectedCategory);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.title?.toLowerCase().includes(term) ||
                p.shortDescription?.toLowerCase().includes(term)
            );
        }

        switch (sortBy) {
            case 'name-asc': filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
            case 'name-desc': filtered.sort((a, b) => (b.title || '').localeCompare(a.title || '')); break;
            case 'price-asc': filtered.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
            case 'price-desc': filtered.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
            case 'newest': filtered.sort((a, b) => {
                const getTime = (t) => t?.toMillis?.() || 0;
                return getTime(b.timestampCreate) - getTime(a.timestampCreate);
            }); break;
        }

        return filtered;
    }, [products, sortBy, selectedCategory, searchTerm]);

    const handleQuickAdd = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user?.uid) {
            toast.error("Connectez-vous pour ajouter au panier");
            // We could redirect but simple toast is fine for quick add
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
                <div className="text-center">
                    <Loader2 size={24} strokeWidth={1} className="animate-spin text-neutral-400 mx-auto mb-4" />
                    <p className="text-xs text-neutral-400 uppercase tracking-widest">Chargement</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-24">
            {/* Header */}
            <header className="border-b border-neutral-100">
                <div className="max-w-7xl mx-auto px-6 py-16">
                    <nav className="flex items-center justify-center gap-2 text-xs text-neutral-400 uppercase tracking-widest mb-6">
                        <Link href="/" className="hover:text-neutral-900 transition-colors">Accueil</Link>
                        <span>/</span>
                        <span className="text-neutral-900">Produits</span>
                    </nav>

                    <h1 className="text-3xl md:text-4xl font-light text-neutral-900 text-center tracking-tight mb-4">
                        Tous nos Produits
                    </h1>

                    <p className="text-sm text-neutral-500 text-center max-w-xl mx-auto">
                        Découvrez notre collection de pièces soigneusement sélectionnées
                    </p>

                    <p className="text-xs text-neutral-400 text-center mt-6 uppercase tracking-widest">
                        {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </header>

            {/* Toolbar */}
            <div className="sticky top-16 z-40 bg-white border-b border-neutral-100">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative w-full md:w-80">
                            <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher..."
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border-0 text-sm placeholder:text-neutral-400 focus:ring-1 focus:ring-neutral-200 focus:bg-white transition-all outline-none"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="flex-1 md:flex-none px-4 py-2.5 bg-neutral-50 border-0 text-sm focus:ring-1 focus:ring-neutral-200 appearance-none cursor-pointer outline-none"
                            >
                                <option value="">Toutes les catégories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex-1 md:flex-none px-4 py-2.5 bg-neutral-50 border-0 text-sm focus:ring-1 focus:ring-neutral-200 appearance-none cursor-pointer outline-none"
                            >
                                <option value="newest">Plus récents</option>
                                <option value="name-asc">Nom A-Z</option>
                                <option value="name-desc">Nom Z-A</option>
                                <option value="price-asc">Prix ↑</option>
                                <option value="price-desc">Prix ↓</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-sm text-neutral-400 mb-6">Aucun produit trouvé</p>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}
                            className="px-6 py-3 bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                        >
                            Réinitialiser
                        </button>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product, index) => {
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
                                            <div className="relative aspect-[3/4] bg-neutral-50 overflow-hidden mb-4">
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
                                                        className="absolute bottom-3 right-3 w-10 h-10 bg-white border border-neutral-200 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-neutral-900 hover:text-white hover:border-neutral-900"
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
            </main>
        </div>
    );
}
