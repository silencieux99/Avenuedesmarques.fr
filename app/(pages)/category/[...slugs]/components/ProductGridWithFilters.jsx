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
            // Newest (default) -- assuming we'd use a real date, but for now relying on existing order or adding a date check if data exists
            // result.sort...
        }

        return result;
    }, [products, selectedBrands, priceRange, sortOrder]);

    const activeBrands = brands?.filter(b =>
        products.some(p => p.brandId === b.id)
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 relative">

            {/* Mobile Filter Button - Sticky below Header */}
            <div className="lg:hidden flex justify-between items-center mb-4 sticky top-[80px] z-30 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-gray-100 shadow-sm mx-auto w-full max-w-sm">
                <span className="font-semibold text-gray-900">{filteredProducts.length} Produits</span>
                <Button
                    size="sm"
                    variant="solid"
                    color="primary"
                    className="bg-black text-white"
                    startContent={<SlidersHorizontal size={16} />}
                    onPress={() => setIsMobileFilterOpen(true)}
                >
                    Filtrer
                </Button>
            </div>

            {/* Sidebar Filters */}
            {/* 
                Desktop: Sticky under header 
                Mobile: Fixed full height drawer z-[90] to be above header 
            */}
            <aside className={`
                fixed inset-y-0 left-0 z-[99] w-[85vw] max-w-[320px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:sticky lg:top-32 lg:z-0 lg:w-64 lg:shadow-none lg:block lg:self-start lg:h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-4
                ${isMobileFilterOpen ? "translate-x-0" : "-translate-x-full"}
                flex flex-col rounded-r-2xl lg:rounded-none
            `}>
                <div className="p-6 flex-1 overflow-y-auto lg:p-0">
                    <div className="flex justify-between items-center lg:hidden mb-8">
                        <h2 className="text-xl font-bold font-serif uppercase">Filtres</h2>
                        <Button isIconOnly variant="light" onPress={() => setIsMobileFilterOpen(false)}>
                            <X size={24} />
                        </Button>
                    </div>

                    <div className="space-y-8 pb-20 lg:pb-0">
                        {/* Sort (Visible sort on Mobile only) */}
                        <div className="lg:hidden">
                            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-500">Trier par</h3>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    className={`justify-start border ${sortOrder === 'newest' ? 'bg-black text-white border-black' : 'bg-transparent border-gray-200'}`}
                                    onPress={() => setSortOrder('newest')}
                                >
                                    Nouveautés
                                </Button>
                                <Button
                                    size="sm"
                                    className={`justify-start border ${sortOrder === 'price-asc' ? 'bg-black text-white border-black' : 'bg-transparent border-gray-200'}`}
                                    onPress={() => setSortOrder('price-asc')}
                                >
                                    Prix -
                                </Button>
                                <Button
                                    size="sm"
                                    className={`justify-start border ${sortOrder === 'price-desc' ? 'bg-black text-white border-black' : 'bg-transparent border-gray-200'}`}
                                    onPress={() => setSortOrder('price-desc')}
                                >
                                    Prix +
                                </Button>
                            </div>
                        </div>

                        {/* Brands Filter */}
                        <div>
                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-900 lg:text-gray-500">Marques</h3>
                            {activeBrands && activeBrands.length > 0 ? (
                                <CheckboxGroup
                                    value={selectedBrands}
                                    onValueChange={setSelectedBrands}
                                    classNames={{
                                        wrapper: "gap-3"
                                    }}
                                >
                                    {activeBrands.map(brand => (
                                        <Checkbox
                                            key={brand.id}
                                            value={brand.id}
                                            classNames={{
                                                wrapper: "before:border-gray-300",
                                                label: "text-base lg:text-sm text-gray-700 ml-1"
                                            }}
                                        >
                                            {brand.name}
                                        </Checkbox>
                                    ))}
                                </CheckboxGroup>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Aucune marque disponible.</p>
                            )}
                        </div>

                        {/* Price Filter - Improved Padding */}
                        <div className="pr-4 lg:pr-0">
                            <h3 className="font-semibold mb-6 text-sm uppercase tracking-wider text-gray-900 lg:text-gray-500">Prix</h3>
                            <div className="px-2"> { /* Extra padding container for slider handles */}
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
                                    // Customizing render behavior for better mobile touch
                                    classNames={{
                                        track: "h-1 bg-gray-200",
                                        filler: "bg-black",
                                        thumb: "w-5 h-5 bg-white border-2 border-black shadow-sm after:bg-black"
                                    }}
                                />
                            </div>
                            <div className="flex justify-between mt-4 text-sm font-medium text-gray-900">
                                <span>{priceRange[0]}€</span>
                                <span>{priceRange[1]}€</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Apply Button Fixed Bottom */}
                <div className="p-4 border-t bg-white lg:hidden mt-auto">
                    <Button fullWidth className="bg-black text-white h-12 font-medium" onPress={() => setIsMobileFilterOpen(false)}>
                        Voir {filteredProducts.length} produits
                    </Button>
                </div>
            </aside>

            {/* Overlay for Mobile */}
            {isMobileFilterOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileFilterOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0"> {/* min-w-0 prevents flex items from overflowing */}
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
                                    className="capitalize font-medium text-gray-900"
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
                            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10"
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
                            <div className="w-16 h-1 bg-gray-200 rounded-full mb-4" />
                            <p className="text-xl md:text-2xl text-gray-400 font-serif">
                                0 produit
                            </p>
                            <Button
                                variant="light"
                                className="text-black underline"
                                onPress={() => {
                                    setSelectedBrands([]);
                                    setPriceRange([minPrice, maxPrice]);
                                }}
                            >
                                Tout effacer
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
