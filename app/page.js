import {
  getFeaturedProducts,
  getProducts,
} from "@/lib/firestore/products/read_server";
import Header from "./components/Header";
import HeroSection from "./components/Sliders";
import Collections from "./components/Collections";
import { getCollections } from "@/lib/firestore/collections/read_server";
import Categories from "./components/Categories";
import { getCategories } from "@/lib/firestore/categories/read_server";
import ProductsGridView from "./components/Products";
import CustomerReviews from "./components/CustomerReviews";
import Brands from "./components/Brands";
import { getBrands } from "@/lib/firestore/brands/read_server";
import Footer from "./components/Footer";

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [featuredProducts, collections, categories, products, brands] =
    await Promise.all([
      getFeaturedProducts(),
      getCollections(),
      getCategories(),
      getProducts(),
      getBrands(),
    ]);

  return (
    <main className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <Header />
      <div className="pt-24 md:pt-32">
        <HeroSection featuredProducts={featuredProducts} />
        <div className="flex flex-col gap-8 md:gap-16 pb-16 md:pb-20">
          <Collections collections={collections} />
          <Categories categories={categories} />
          <ProductsGridView products={products} />
          <CustomerReviews />
          <Brands brands={brands} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
