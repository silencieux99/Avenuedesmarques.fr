"use client";

import Link from "next/link";

export default function Categories({ categories }) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-col gap-8 justify-center overflow-hidden py-10">
      <div className="flex justify-center w-full">
        <h1 className="font-serif text-2xl tracking-wide uppercase text-primary">Explorer par Catégorie</h1>
      </div>
      <div className="flex justify-center flex-wrap gap-8 md:gap-12 px-4">
        {categories?.map((category) => (
          <Link href={`/categories/${category?.id}`} key={category?.id}>
            <div className="flex flex-col gap-3 items-center group cursor-pointer">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border border-gray-200 p-1 overflow-hidden transition-all duration-300 group-hover:border-accent group-hover:scale-105">
                <img
                  src={category?.imageURL}
                  alt={category?.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <h1 className="font-medium text-sm tracking-widest uppercase group-hover:text-accent transition-colors">
                {category?.name}
              </h1>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
