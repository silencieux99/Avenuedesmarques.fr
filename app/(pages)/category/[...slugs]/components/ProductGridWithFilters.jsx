"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/app/components/Products";
import { Slider, Checkbox, CheckboxGroup, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductGridWithFilters({ products, brands, categoryName }) {
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Filters State
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 2000]);
    const [sortOrder, setSortOrder] = useState("newest"); // newest, price-asc, price-desc

    // Compute Min/Max Prices from products to set slider bounds
    const { minPrice, maxPrice } = useMemo(() => {
        if (!products || products.length === 0) return { minPrice: 0, maxPrice: 1000 };
        const prices = products.map(p => p.price || 0);
        return {
            minPrice: Math.floor(Math.min(...prices)),
            maxPrice: Math.ceil(Math.max(...prices))
        };
    }, [products]);

    // Update range when products change (optional, or stick to absolute bounds)
    // useMemo(() => setPriceRange([minPrice, maxPrice]), [minPrice, maxPrice]); 
    // ^ Avoiding auto-reset to avoid UX annoyance during filtering if logic changes.

    const filteredProducts = useMemo(() => {
        let result = [...products];

        // 1. Filter by Brand
        if (selectedBrands.length > 0) {
            result = result.filter(p => selectedBrands.includes(p.brandId));
        }

        // 2. Filter by Price
        result = result.filter(p => {
            const pPrice = p.price || 0;
            return pPrice >= priceRange[0] && pPrice <= priceRange[1];
        });

        // 3. Sort
        if (sortOrder === "price-asc") {
            result.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortOrder === "price-desc") {
            result.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else {
            // Newest (default)
            // Assuming timestampCreate is object or string, simple compare
            // result.sort((a, b) => b.timestampCreate - a.timestampCreate);
        }

        return result;
    }, [products, selectedBrands, priceRange, sortOrder]);

    const activeBrands = brands?.filter(b =>
        products.some(p => p.brandId === b.id)
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 relative">

            {/* Mobile Filter Button */}
            <div className="lg:hidden flex justify-between items-center mb-4 sticky top-20 z-30 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="font-semibold text-gray-900">{filteredProducts.length} Produits</span>
                <Button
                    variant="flat"
                    startContent={<SlidersHorizontal size={16} />}
                    onPress={() => setIsMobileFilterOpen(true)}
                >
                    Filtrer & Trier
                </Button>
            </div>

            {/* Sidebar Filters (Desktop) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:w-64 lg:shadow-none lg:block
                ${isMobileFilterOpen ? "translate-x-0" : "-translate-x-full"}
                flex flex-col
            `}>
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center lg:hidden mb-6">
                        <h2 className="text-xl font-bold font-serif uppercase">Filtres</h2>
                        <Button isIconOnly variant="light" onPress={() => setIsMobileFilterOpen(false)}>
                            <X size={24} />
                        </Button>
                    </div>

                    <div className="space-y-8">
                        {/* Sort (Visible on Mobile inside Drawer, Desktop has Sort Dropdown usually on top) */}
                        <div className="lg:hidden">
                            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Trier par</h3>
                            <div className="flex flex-col gap-2">
                                <Button
                                    className={`justify-start ${sortOrder === 'newest' ? 'bg-black text-white' : 'bg-gray-100'}`}
                                    onPress={() => setSortOrder('newest')}
                                >
                                    Nouveautés
                                </Button>
                                <Button
                                    className={`justify-start ${sortOrder === 'price-asc' ? 'bg-black text-white' : 'bg-gray-100'}`}
                                    onPress={() => setSortOrder('price-asc')}
                                >
                                    Prix croissant
                                </Button>
                                <Button
                                    className={`justify-start ${sortOrder === 'price-desc' ? 'bg-black text-white' : 'bg-gray-100'}`}
                                    onPress={() => setSortOrder('price-desc')}
                                >
                                    Prix décroissant
                                </Button>
                            </div>
                        </div>

                        {/* Brands Filter */}
                        <div>
                            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Marques</h3>
                            <CheckboxGroup
                                value={selectedBrands}
                                onValueChange={setSelectedBrands}
                                classNames={{
                                    wrapper: "gap-3"
                                }}
                            >
                                {activeBrands?.map(brand => (
                                    <Checkbox
                                        key={brand.id}
                                        value={brand.id}
                                        classNames={{
                                            label: "text-sm text-gray-600 ml-1 group-data-[selected=true]:text-black"
                                        }}
                                    >
                                        {brand.name}
                                    </Checkbox>
                                ))}
                            </CheckboxGroup>
                        </div>

                        {/* Price Filter */}
                        <div>
                            <h3 className="font-semibold mb-6 text-sm uppercase tracking-wider">Prix</h3>
                            <Slider
                                step={10}
                                minValue={0}
                                maxValue={maxPrice > 0 ? maxPrice : 2000}
                                value={priceRange}
                                onChange={setPriceRange}
                                formatOptions={{ style: "currency", currency: "EUR" }}
                                className="max-w-md"
                                size="sm"
                                color="foreground"
                                startContent={<span className="text-xs text-gray-500 w-8">{priceRange[0]}€</span>}
                                endContent={<span className="text-xs text-gray-500 w-8">{priceRange[1]}€</span>}
                            />
                        </div>
                    </div>
                </div>

                {/* Mobile Apply Button */}
                <div className="p-4 border-t lg:hidden">
                    <Button fullWidth className="bg-black text-white" onPress={() => setIsMobileFilterOpen(false)}>
                        Afficher {filteredProducts.length} produits
                    </Button>
                </div>
            </aside>

            {/* Overlay for Mobile */}
            {isMobileFilterOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileFilterOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1">
                {/* Desktop Top Bar (Sort) */}
                <div className="hidden lg:flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <p className="text-gray-500 text-sm">{filteredProducts.length} résultats</p>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Trier par:</span>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    variant="light"
                                    endContent={<ChevronDown size={14} />}
                                    className="capitalize font-medium"
                                >
                                    {sortOrder === 'newest' && "Nouveautés"}
                                    {sortOrder === 'price-asc' && "Prix croissant"}
                                    {sortOrder === 'price-desc' && "Prix décroissant"}
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Sort options"
                                selectionMode="single"
                                selectedKeys={[sortOrder]}
                                onSelectionChange={(keys) => setSortOrder(Array.from(keys)[0])}
                            >
                                <DropdownItem key="newest">Nouveautés</DropdownItem>
                                <DropdownItem key="price-asc">Prix croissant</DropdownItem>
                                <DropdownItem key="price-desc">Prix décroissant</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="min-h-[400px]">
                    {filteredProducts.length > 0 ? (
                        <motion.div
                            layout
                            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-x-8 md:gap-y-12"
                        >
                            <AnimatePresence>
                                {filteredProducts.map((item) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={item.id}
                                    >
                                        <ProductCard product={item} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <p className="text-xl md:text-2xl text-gray-500 font-serif">
                                Aucun produit ne correspond à vos critères.
                            </p>
                            <Button
                                variant="light"
                                onPress={() => {
                                    setSelectedBrands([]);
                                    setPriceRange([0, maxPrice]);
                                }}
                            >
                                Réinitialiser les filtres
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
