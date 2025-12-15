'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
    ChevronDown, ChevronUp, Check, Shield, Package, Truck,
    X, ChevronLeft, ChevronRight, ZoomIn
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- Image Zoom Viewer ---
function ImageZoomViewer({ images, initialIndex, isOpen, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setScale(1);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, initialIndex]);

    if (!isOpen) return null;

    const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center pointer-events-auto touch-none"
        >
            {/* Controls */}
            <div className="absolute top-4 right-4 z-50 flex gap-4">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                    <X size={24} />
                </button>
            </div>

            {/* Navigation Buttons (Desktop) */}
            <button onClick={prev} className="hidden md:block absolute left-8 p-4 text-white hover:bg-white/10 rounded-full transition-colors z-50">
                <ChevronLeft size={40} />
            </button>
            <button onClick={next} className="hidden md:block absolute right-8 p-4 text-white hover:bg-white/10 rounded-full transition-colors z-50">
                <ChevronRight size={40} />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 z-50 px-3 py-1 bg-black/50 text-white rounded text-sm font-medium">
                {currentIndex + 1} / {images.length}
            </div>

            {/* Main Image Container */}
            <motion.div
                className="relative w-full h-full flex items-center justify-center p-4 md:p-20"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                    const swipe = offset.x;
                    if (swipe < -100) next();
                    else if (swipe > 100) prev();
                }}
            >
                <div
                    className="relative w-full h-full max-w-7xl max-h-[85vh] select-none"
                    onClick={() => setScale(scale > 1 ? 1 : 2)}
                >
                    <Image
                        src={images[currentIndex].url}
                        alt={images[currentIndex].alt || `View ${currentIndex}`}
                        fill
                        className="object-contain"
                        quality={100}
                        priority
                        style={{
                            transform: `scale(${scale})`,
                            transition: 'transform 0.3s ease',
                            cursor: scale > 1 ? 'zoom-out' : 'zoom-in'
                        }}
                    />
                </div>
            </motion.div>

            {/* Thumbnails (Bottom) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-2 hide-scrollbar z-50">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                        className={`relative w-12 h-12 md:w-16 md:h-16 rounded border-2 overflow-hidden flex-shrink-0 transition-all ${idx === currentIndex ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-100'
                            }`}
                    >
                        <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                ))}
            </div>
        </motion.div>
    );
}

// --- Vertical Gallery (Desktop & Mobile) ---
export function VerticalGallery({ images, productName }) {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    // Mobile Swipe State
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;

        const diff = touchStartX.current - touchEndX.current;
        const threshold = 50; // min distance to be considered a swipe

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe Left -> Next
                setSelectedImageIndex((prev) => (prev + 1) % images.length);
            } else {
                // Swipe Right -> Prev
                setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
            }
        }
        // Reset
        touchStartX.current = 0;
        touchEndX.current = 0;
    };


    if (!images || images.length === 0) return null;

    return (
        <div className="w-full h-full flex flex-col gap-4">

            {/* Mobile: Swipeable Carousel */}
            <div
                className="lg:hidden w-full relative aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden group touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <motion.div
                    key={selectedImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full relative"
                    onClick={() => setIsZoomOpen(true)}
                >
                    <Image
                        src={images[selectedImageIndex].url}
                        alt={productName}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn size={20} />
                    </div>
                </motion.div>

                {/* Mobile Navigation Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                                className={`h-1.5 rounded-full transition-all duration-300 ${selectedImageIndex === idx
                                    ? 'bg-white w-6 shadow'
                                    : 'bg-white/40 w-1.5'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Mobile Navigation Arrows (Optional visual cue) */}
                <div className="absolute inset-y-0 left-0 flex items-center px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/20 p-1 rounded-full text-white backdrop-blur-sm">
                        <ChevronLeft size={20} />
                    </div>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/20 p-1 rounded-full text-white backdrop-blur-sm">
                        <ChevronRight size={20} />
                    </div>
                </div>
            </div>

            {/* Desktop: Vertical Grid */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
                {images.map((img, idx) => (
                    <div
                        key={img.id || idx}
                        onClick={() => { setSelectedImageIndex(idx); setIsZoomOpen(true); }}
                        className={`relative aspect-[3/4] bg-neutral-50 cursor-zoom-in group overflow-hidden rounded-lg ${idx === 0 ? 'col-span-2 aspect-[4/5]' : ''
                            }`}
                    >
                        <Image
                            src={img.url}
                            alt={img.alt || productName}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            quality={idx === 0 ? 90 : 75}
                            priority={idx < 2}
                            sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                        <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            <ZoomIn size={20} className="text-neutral-900" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Global Zoom Viewer Modal */}
            <AnimatePresence>
                {isZoomOpen && (
                    <ImageZoomViewer
                        images={images}
                        initialIndex={selectedImageIndex}
                        isOpen={isZoomOpen}
                        onClose={() => setIsZoomOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Product Accordion ---
function AccordionItem({ title, content, isOpen = false }) {
    const [open, setOpen] = useState(isOpen);

    return (
        <div className="border-b border-neutral-200">
            <button
                onClick={() => setOpen(!open)}
                className="w-full py-4 flex items-center justify-between text-left group"
            >
                <span className="text-sm font-medium text-neutral-900 group-hover:text-accent transition-colors uppercase tracking-wide">
                    {title}
                </span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-4 text-sm text-neutral-600 leading-relaxed font-light">
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function ProductDetailsAccordion({ description }) {
    return (
        <div className="w-full">
            <AccordionItem
                title="Description"
                content={<div className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: description }} />}
                isOpen={true}
            />
            <AccordionItem
                title="Composition & Entretien"
                content={
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Lavage à 30°C délicat</li>
                        <li>Ne pas sécher en machine</li>
                        <li>Repassage doux</li>
                    </ul>
                }
            />
            <AccordionItem
                title="Livraison & Retours"
                content={
                    <p>
                        Livraison offerte dès 100€ d'achat.<br />
                        Retours gratuits sous 30 jours.
                    </p>
                }
            />
        </div>
    );
}

// --- Trust Badges ---
export function TrustBadges() {
    return (
        <div className="grid grid-cols-2 gap-4 py-6 border-y border-neutral-100 my-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-accent">
                    <Truck size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold uppercase text-neutral-900">Livraison Rapide</div>
                    <div className="text-[10px] text-neutral-500">Expédié sous 24/48h</div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-accent">
                    <Shield size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold uppercase text-neutral-900">Paiement Sécurisé</div>
                    <div className="text-[10px] text-neutral-500">Protection SSL 100%</div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-accent">
                    <Package size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold uppercase text-neutral-900">Retours Simples</div>
                    <div className="text-[10px] text-neutral-500">30 jours pour changer d'avis</div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-accent">
                    <Check size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold uppercase text-neutral-900">Qualité Garantie</div>
                    <div className="text-[10px] text-neutral-500">Contrôle qualité rigoureux</div>
                </div>
            </div>
        </div>
    );
}

// --- Sticky Mobile Add To Cart ---
export function StickyMobileBar({ price, onAddToCart, productName, image }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show only after scrolling past the main hero area (approx 800px)
            if (window.scrollY > 800) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 p-4 shadow-lg lg:hidden animate-slide-up">
            <div className="flex items-center gap-4">
                {image && (
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-neutral-100 flex-shrink-0">
                        <Image src={image} alt="" fill className="object-cover" />
                    </div>
                )}
                <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-900 line-clamp-1">{productName}</div>
                    <div className="text-sm font-bold text-neutral-900">
                        {price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
                <button
                    onClick={onAddToCart}
                    className="bg-black text-white px-6 py-3 rounded text-sm font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                >
                    Ajouter
                </button>
            </div>
        </div>
    );
}

// --- Stock Urgency Indicator ---
export function StockUrgency({ stock }) {
    if (stock > 10) return null;
    if (stock <= 0) return <div className="text-red-600 text-sm font-medium mb-4">Rupture de stock</div>;

    return (
        <div className="flex items-center gap-2 mb-4 bg-red-50 text-red-700 px-3 py-2 rounded text-sm font-medium animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-600"></div>
            Plus que {stock} articles en stock !
        </div>
    );
}
