"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FeaturedProductSlider({ featuredProducts }) {
  // Use the first featured product or a default luxury banner
  const heroImage = featuredProducts?.[0]?.featureImageURL || "https://images.unsplash.com/photo-1490481651871-618bf795973e?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image with Parallax Effect (Simulated via fixed/cover) */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/30 md:bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-center items-center text-center px-4 max-w-[1440px] mx-auto">
        <h2 className="text-white/90 text-sm md:text-lg tracking-[0.3em] font-medium uppercase mb-4 animate-fade-in-up">
          Collection 2026
        </h2>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white font-bold mb-8 drop-shadow-lg animate-fade-in-up delay-100">
          L'ART DE VIVRE
        </h1>
        <p className="max-w-xl text-white/90 text-lg mb-10 font-light leading-relaxed animate-fade-in-up delay-200">
          Découvrez notre nouvelle sélection exclusive. L'élégance intemporelle rencontre la modernité avenue des marques.
        </p>

        <Link href="/collections">
          <Button
            radius="none"
            size="lg"
            className="bg-white text-primary hover:bg-accent hover:text-white px-10 py-6 text-sm font-semibold tracking-widest uppercase transition-all duration-300 animate-fade-in-up delay-300"
            endContent={<ArrowRight className="w-4 h-4" />}
          >
            Découvrir
          </Button>
        </Link>
      </div>
    </div>
  );
}
