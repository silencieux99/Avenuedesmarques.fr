"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function HeroModern({ heroProducts }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter valid products with images
    const validProducts = heroProducts?.filter(p => p.featureImageURL) || [];
    // If no products, fallback to default images
    const images = validProducts.length > 0
        ? validProducts.map(p => p.featureImageURL)
        : [
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
        ];

    useEffect(() => {
        if (images.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000); // Change every 5 seconds
        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <section className="relative h-[calc(90vh)] md:h-[calc(100vh-40px)] w-full overflow-hidden bg-neutral-900">
            {/* Background Media - Immersive & Darkened */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0 h-full w-full"
                    >
                        <Image
                            src={images[currentIndex]}
                            alt="Collection Avenue des Marques"
                            fill
                            className="object-cover object-top opacity-90"
                            priority={currentIndex === 0}
                            sizes="100vw"
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Fine Grain Overlay - Removed noise.png due to 404, using CSS pattern if needed or just transparent */}
                <div className="absolute inset-0 bg-black/20 opacity-20 z-10" />
                {/* Gradient Fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent z-10" />
            </div>

            {/* Content Container - Floating & Minimal */}
            <div className="relative z-10 flex h-full flex-col justify-end items-center pb-16 px-6 md:px-12 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="flex flex-col items-center"
                >
                    <Link
                        href="/brands"
                        className="group relative px-10 py-3 overflow-hidden bg-transparent border border-white transition-all duration-500 hover:bg-white"
                    >
                        <span className="relative z-10 text-xs tracking-[0.3em] uppercase font-light text-white group-hover:text-neutral-900 transition-colors duration-500">
                            Voir nos marques
                        </span>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
