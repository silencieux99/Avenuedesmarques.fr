"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function HeroModern({ heroProducts }) {
    // Use the first hero product or fallback to a luxury image
    const mainProduct = heroProducts?.[0];
    const heroImage = mainProduct?.featureImageURL || "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop";

    return (
        <section className="relative h-[calc(90vh)] md:h-[calc(100vh-40px)] w-full overflow-hidden bg-neutral-900">
            {/* Background Media - Immersive & Darkened */}
            <div className="absolute inset-0 z-0">
                <div className="relative h-full w-full">
                    {heroImage && (
                        <Image
                            src={heroImage}
                            alt="Collection Avenue des Marques"
                            fill
                            className="object-cover object-top opacity-90"
                            priority
                            sizes="100vw"
                        />
                    )}
                </div>
                {/* Fine Grain Overlay */}
                <div className="absolute inset-0 bg-black/20 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                {/* Gradient Fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />
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
