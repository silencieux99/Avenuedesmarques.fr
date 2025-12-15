import { getProduct } from "@/lib/firestore/products/read_server";
import ProductClientPage from "./components/ProductClientPage";
import RelatedProducts from "./components/RelatedProducts";
import Reviews from "./components/Reviews";
import AddReview from "./components/AddReiveiw";
import AuthContextProvider from "@/contexts/AuthContext";

export async function generateMetadata({ params }) {
  const { productId } = params;
  const product = await getProduct({ id: productId });

  if (!product) {
    return {
      title: "Produit non trouvé | Avenue des Marques",
    };
  }

  const title = `${product?.title} - Pas Cher | Avenue des Marques`;
  const description = product?.shortDescription || `Achetez ${product?.title} au meilleur prix sur Avenue des Marques. Livraison rapide et paiement sécurisé.`;
  const url = `https://avenuedesmarques.fr/products/${productId}`;

  return {
    title: title,
    description: description,
    metadataBase: new URL('https://avenuedesmarques.fr'),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: title,
      description: description,
      url: url,
      siteName: 'Avenue des Marques',
      images: [
        {
          url: product?.featureImageURL,
          width: 800,
          height: 600,
          alt: product?.title,
        },
      ],
      locale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [product?.featureImageURL],
    },
  };
}

export default async function Page({ params }) {
  const { productId } = params;
  const product = await getProduct({ id: productId });

  if (!product) {
    return <div>Product not found</div>;
  }

  // JSON-LD Structured Data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.featureImageURL,
    description: product.shortDescription || product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Avenue des Marques',
    },
    offers: {
      '@type': 'Offer',
      url: `https://avenuedesmarques.fr/products/${productId}`,
      priceCurrency: 'EUR',
      price: product.salePrice > 0 ? product.salePrice : product.price,
      availability: product.stock !== undefined && product.stock <= 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuthContextProvider>
        <ProductClientPage product={product} />

        <div className="max-w-[1440px] mx-auto px-4 md:px-8 pb-20">
          {/* Reviews Section from original page, kept for completeness */}
          <div className="mt-20 border-t border-gray-100 pt-10">
            <div className="flex flex-col gap-10 max-w-4xl mx-auto">
              <div className="flex flex-col gap-4">
                <h2 className="font-serif text-2xl text-center">Avis Clients</h2>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3">
                    <AddReview productId={productId} />
                  </div>
                  <div className="w-full md:w-2/3">
                    <Reviews productId={productId} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <h2 className="font-serif text-xl md:text-2xl mb-8 uppercase tracking-widest text-center">Vous aimerez aussi</h2>
            <RelatedProducts categoryId={product?.categoryId} />
          </div>
        </div>
      </AuthContextProvider>
    </main>
  );
}
