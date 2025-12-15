"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Collections({ collections }) {
  if (collections.length === 0) return null;

  return (
    <section className="px-4 max-w-[1440px] mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 h-auto md:h-[600px]">
        {collections?.slice(0, 2).map((collection) => (
          <Link
            href={`/collections/${collection?.id}`}
            key={collection?.id}
            className="relative group overflow-hidden h-[400px] md:h-full w-full"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${collection?.imageURL})` }}
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <h3 className="text-white/80 text-xs md:text-sm tracking-[0.2em] mb-2 uppercase translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                Collection
              </h3>
              <h2 className="text-3xl md:text-5xl font-serif text-white mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                {collection?.title}
              </h2>
              <div className="flex items-center gap-2 text-white border-b border-white/50 w-fit pb-1 group-hover:border-white transition-colors translate-y-4 group-hover:translate-y-0 duration-500 delay-100">
                <span className="text-sm tracking-widest uppercase">Découvrir</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
