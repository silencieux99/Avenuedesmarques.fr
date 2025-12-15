"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function HeroModern({ heroSlides }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const slides = heroSlides && heroSlides.length > 0 ? heroSlides : [
        {
            imageURL: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
            title: "Nouvelle Collection",
            link: "/products"
        }
    ];

    useEffect(() => {
        if (slides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000); // Change every 5 seconds
        return () => clearInterval(interval);
    }, [slides.length]);

    const currentSlide = slides[currentIndex];

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
                            src={currentSlide.imageURL}
                            alt={currentSlide.title || "Collection Avenue des Marques"}
                            fill
                            className="object-cover object-top opacity-90"
                            priority={currentIndex === 0}
                            sizes="100vw"
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Fine Grain Overlay - Removed noise.png */}
                <div className="absolute inset-0 bg-black/20 opacity-20 z-10" />
                {/* Gradient Fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent z-10" />
            </div>

            {/* Content Container - Floating & Minimal */}
            <div className="relative z-10 flex h-full flex-col justify-end items-center pb-16 px-6 md:px-12 max-w-7xl mx-auto">
                <motion.div
                    key={`content-${currentIndex}`} // Re-animate content on slide change
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="flex flex-col items-center gap-4"
                >
                    {currentSlide.title && (
                        <h2 className="text-white text-3xl md:text-5xl font-serif font-light tracking-wide text-center drop-shadow-lg">
                            {currentSlide.title}
                        </h2>
                    )}

                    <Link
                        href={currentSlide.link || "/products"}
                        className="group relative px-10 py-3 overflow-hidden bg-transparent border border-white transition-all duration-500 hover:bg-white inline-block mt-4"
                    >
                        <span className="relative z-10 text-xs tracking-[0.3em] uppercase font-light text-white group-hover:text-neutral-900 transition-colors duration-500">
                            {currentSlide.buttonText || "Découvrir"}
                        </span>
                    </Link>
                </motion.div>
            </div>

            {/* Slide Indicators */}
            {slides.length > 1 && (
                <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-3">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-8 bg-white" : "w-1 bg-white/40 hover:bg-white/60"
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
