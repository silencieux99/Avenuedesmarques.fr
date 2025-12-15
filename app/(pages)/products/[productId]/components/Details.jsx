import AddToCartButton from "@/app/components/AddToCartButton";
import FavoriteButton from "@/app/components/FavoriteButton";
import AuthContextProvider from "@/contexts/AuthContext";
import { getBrand } from "@/lib/firestore/brands/read_server";
import { getCategory } from "@/lib/firestore/categories/read_server";
import Link from "next/link";

export default function Details({ product }) {
  return (
    <div className="w-full flex flex-col gap-8 md:sticky md:top-32 h-fit animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-2">
            <Brand brandId={product?.brandId} />
            <h1 className="font-serif text-3xl md:text-5xl text-gray-900 font-bold leading-tight">
              {product?.title}
            </h1>
          </div>
          <AuthContextProvider>
            <div className="flex-shrink-0">
              <FavoriteButton type="large" productId={product?.id} />
            </div>
          </AuthContextProvider>
        </div>

        <div className="flex items-baseline gap-4">
          <p className="text-2xl md:text-3xl font-light text-gray-900">
            {product?.salePrice} €
          </p>
          {product?.price > product?.salePrice && (
            <span className="line-through text-gray-400 text-lg">
              {product?.price} €
            </span>
          )}
          {product?.price > product?.salePrice && (
            <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider rounded-full">
              -{Math.round(((product?.price - product?.salePrice) / product?.price) * 100)}%
            </span>
          )}
        </div>
      </div>

      <div className="text-gray-600 text-sm leading-relaxed font-light tracking-wide border-l-2 border-accent/20 pl-4">
        {product?.shortDescription}
      </div>

      <div className="flex flex-col gap-4 pt-8 border-t border-gray-100">
        {product?.stock <= (product?.orders ?? 0) ? (
          <button disabled className="w-full py-5 bg-gray-100 text-gray-400 text-xs uppercase tracking-[0.2em] font-bold cursor-not-allowed border border-gray-200">
            Rupture de stock
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <Link href={`/checkout?type=buynow&productId=${product?.id}`} className="w-full">
              <button className="w-full py-5 bg-black text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-accent transition-all duration-300 shadow-lg hover:shadow-accent/20">
                Acheter maintenant
              </button>
            </Link>
            <AuthContextProvider>
              <div className="w-full">
                <AddToCartButton type="large" productId={product?.id} />
              </div>
            </AuthContextProvider>

            <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest mt-2">
              Livraison gratuite & Retours sous 30 jours
            </p>
          </div>
        )}
      </div>

      {/* Detailed Description Accordion-like style */}
      <div className="mt-8 pt-8 border-t border-gray-100">
        <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-gray-900"></span>
          Détails & Description
        </h3>
        <div
          className="text-gray-600 text-sm font-light leading-relaxed space-y-4 prose prose-sm max-w-none prose-p:my-2 prose-headings:font-serif prose-headings:font-normal"
          dangerouslySetInnerHTML={{ __html: product?.description ?? "" }}
        ></div>
      </div>
    </div>
  );
}

async function Brand({ brandId }) {
  const brand = await getBrand({ id: brandId });
  if (!brand) return null;
  return (
    <Link href={`/search?brandId=${brandId}`}>
      <h4 className="text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-accent transition-colors mb-2">
        {brand?.name}
      </h4>
    </Link>
  );
}
