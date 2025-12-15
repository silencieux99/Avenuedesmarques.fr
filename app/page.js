import {
  getFeaturedProducts,
  getProducts,
} from "@/lib/firestore/products/read_server";
import { getHeroSlides } from "@/lib/firestore/hero/read_server";
import Link from "next/link";
import { ProductCard } from "./components/Products";
import Header from "./components/Header";
import HeroModern from "./components/HeroModern";
import Collections from "./components/Collections";
import { getCollections } from "@/lib/firestore/collections/read_server";
import { getCategories } from "@/lib/firestore/categories/read_server";
import Brands from "./components/Brands";
import { getBrands } from "@/lib/firestore/brands/read_server";
import Footer from "./components/Footer";

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [featuredProducts, collections, categories, products, brands, heroSlides] =
    await Promise.all([
      getFeaturedProducts(),
      getCollections(),
      getCategories(),
      getProducts(),
      getBrands(),
      getHeroSlides(),
    ]);

  // Helper function to build full category path with parent slugs
  const buildCategoryPath = (category) => {
    const path = [];
    let current = category;

    // Build path from child to parent
    while (current) {
      path.unshift(current.slug);
      current = categories.find(c => c.id === current.parentId);
    }

    return `/category/${path.join('/')}`;
  };

  // Group products by category
  const productsByCategory = categories.reduce((acc, category) => {
    const categoryProducts = products.filter(p => p.categoryId === category.id).slice(0, 4); // Limit to 4 for homepage
    if (categoryProducts.length > 0) {
      const categoryPath = buildCategoryPath(category);
      acc.push({
        category: category,
        products: categoryProducts,
        categoryPath: categoryPath
      });
    }
    return acc;
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <Header />
      <div className="pt-8">
        <HeroModern heroSlides={heroSlides} />
        <div className="flex flex-col gap-20 md:gap-32 pb-24 md:pb-32 mt-20 md:mt-32">

          <Collections collections={collections} />

          {/* Dynamic Category Sections */}
          {productsByCategory.map((section) => (
            <section key={section.category.id} className="w-full max-w-[1600px] mx-auto px-4 md:px-8">
              <div className="flex flex-col gap-8 md:gap-10">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 text-center md:text-left">
                  <div className="space-y-2">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold uppercase tracking-wide">
                      {section.category.name}
                    </h2>
                    <div className="h-1 w-20 bg-accent mx-auto md:mx-0" />
                  </div>
                  <Link href={section.categoryPath} className="group flex items-center gap-2 text-sm uppercase tracking-widest font-medium hover:text-accent transition-colors">
                    Voir tout
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                  {section.products.map(product => (
                    <ProductCard product={product} key={product.id} />
                  ))}
                </div>
              </div>
            </section>
          ))}


          <Brands brands={brands} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
