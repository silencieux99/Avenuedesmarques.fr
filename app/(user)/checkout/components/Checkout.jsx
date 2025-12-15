"use client";

import { useAuth } from "@/contexts/AuthContext";
import { createCheckoutAndGetURL } from "@/lib/firestore/checkout/write";
import { Button } from "@nextui-org/react";
import { CheckSquare2Icon, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Checkout({ productList }) {
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState(null);
  const router = useRouter();
  const { user } = useAuth();

  const handleAddress = (key, value) => {
    setAddress({ ...(address ?? {}), [key]: value });
  };

  const shippingCost = 5.90;

  // Calculate total price including shipping
  const subTotal = productList?.reduce((prev, curr) => {
    return prev + curr?.quantity * curr?.product?.salePrice;
  }, 0) || 0;

  const totalPrice = subTotal + shippingCost;

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    try {
      if (subTotal <= 0) {
        throw new Error("Price should be greater than 0");
      }
      if (!address?.email) {
        throw new Error("Veuillez renseigner votre email.");
      }
      if (!address?.fullName || !address?.addressLine1 || !address?.city || !address?.pincode || !address?.country) {
        throw new Error("Veuillez remplir tous les champs obligatoires (adresse, ville, code postal, pays).");
      }

      if (!productList || productList?.length === 0) {
        throw new Error("Product List Is Empty");
      }

      const finalAddress = {
        ...address,
        shippingMethod: "Standard (7-10 jours)",
        shippingCost: shippingCost
      };

      const url = await createCheckoutAndGetURL({
        uid: user?.uid || null,
        products: productList,
        address: finalAddress,
      });
      router.push(url);
    } catch (error) {
      toast.error(error?.message);
    }
    setIsLoading(false);
  };

  const schengenCountries = [
    "France", "Allemagne", "Autriche", "Belgique", "Croatie", "Danemark", "Espagne", "Estonie",
    "Finlande", "Grèce", "Hongrie", "Islande", "Italie", "Lettonie", "Liechtenstein", "Lituanie",
    "Luxembourg", "Malte", "Norvège", "Pays-Bas", "Pologne", "Portugal", "République Tchèque",
    "Slovaquie", "Slovénie", "Suède", "Suisse"
  ];

  return (
    <section className="flex flex-col-reverse lg:flex-row gap-8 max-w-[1200px] mx-auto py-6 px-4 md:px-6">
      {/* Left Column: Form (Main Content) */}
      <section className="flex-1 flex flex-col gap-8">
        {/* Contact & Shipping */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Contact</h2>
            <div className="text-sm text-gray-500">
              Déjà un compte ? <span className="text-black underline cursor-pointer">Se connecter</span>
            </div>
          </div>
          <input
            type="email"
            placeholder="Email"
            value={address?.email ?? ""}
            onChange={(e) => handleAddress("email", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-500"
          />

          <div className="pt-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Adresse de livraison</h2>
            <div className="space-y-3">
              <select
                value={address?.country ?? "France"}
                onChange={(e) => handleAddress("country", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white cursor-pointer"
              >
                <option value="" disabled>Pays / Région</option>
                {schengenCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Prénom"
                  value={address?.firstName ?? ""}
                  onChange={(e) => handleAddress("firstName", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={address?.fullName ?? ""}
                  onChange={(e) => handleAddress("fullName", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <input
                type="text"
                placeholder="Adresse"
                value={address?.addressLine1 ?? ""}
                onChange={(e) => handleAddress("addressLine1", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />

              <input
                type="text"
                placeholder="Bâtiment, appartement, etc. (optionnel)"
                value={address?.addressLine2 ?? ""}
                onChange={(e) => handleAddress("addressLine2", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Code postal"
                  value={address?.pincode ?? ""}
                  onChange={(e) => handleAddress("pincode", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Ville"
                  value={address?.city ?? ""}
                  onChange={(e) => handleAddress("city", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <input
                type="tel"
                placeholder="Téléphone"
                value={address?.mobile ?? ""}
                onChange={(e) => handleAddress("mobile", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Mode d'expédition</h2>
            <div className="flex justify-between items-center p-4 border border-black/10 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <p className="font-medium text-gray-900">Standard</p>
                <p className="text-gray-500 text-xs mt-0.5">7 à 10 jours ouvrés</p>
              </div>
              <span className="text-sm font-medium text-gray-900">5,90 €</span>
            </div>
          </div>

          <div className="pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Paiement</h2>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-gray-50">
                <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-black" />
                </div>
                <span className="text-sm font-medium flex-1">Carte bancaire</span>
                <div className="flex gap-1.5 opacity-80">
                  <span className="text-[10px] font-bold text-blue-800">VISA</span>
                  <span className="text-[10px] font-bold text-red-600">MC</span>
                  <span className="text-[10px] font-bold text-blue-500">AMEX</span>
                </div>
              </div>

              <div className="flex-col p-4 bg-gray-50 text-sm text-gray-500 text-center flex">
                <div className="w-full bg-white border border-gray-200 rounded p-6 flex flex-col items-center gap-2">
                  <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <p>Après avoir cliqué sur "Payer", vous serez redirigé vers Stripe pour compléter votre achat en toute sécurité.</p>
                </div>
              </div>
            </div>
          </div>

          <Button
            isLoading={isLoading}
            isDisabled={isLoading}
            onClick={handlePlaceOrder}
            className="w-full py-7 bg-black text-white rounded-lg text-sm font-bold shadow hover:bg-gray-800 transition-all mt-4"
          >
            Payer {totalPrice.toFixed(2)} €
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-400">Toutes les transactions sont sécurisées et chiffrées.</p>
          </div>
        </div>
      </section>

      {/* Right Column: Summary (Sidebar on Desktop, Top on Mobile typically but user asked for ultra mobile friendly single page... usually collapsible at top or bottom. Here distinct background like Shopify) */}
      <section className="lg:w-[420px] lg:pl-8 lg:border-l lg:border-gray-200 order-1 lg:order-2">
        {/* Mobile Toggle Summary could replace this, but keeping visible for "Shopify style" often means visible sidebar on desktop */}
        <div className="bg-gray-50 lg:bg-transparent -mx-4 px-4 py-6 md:p-0 md:mx-0 rounded-none md:rounded-lg mb-6 lg:mb-0 lg:sticky lg:top-24">
          <div className="flex flex-col gap-4">
            {productList?.map((item, index) => (
              <div key={index} className="flex gap-4 items-center">
                <div className="relative w-16 h-16 bg-white rounded-lg border border-gray-200 overflow-visible shrink-0 flex items-center justify-center p-1">
                  <img
                    className="w-full h-full object-contain mix-blend-multiply"
                    src={item?.product?.featureImageURL}
                    alt={item?.product?.title}
                  />
                  <div className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full">
                    {item?.quantity}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{item?.product?.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{item?.product?.shortDescription}</p>
                </div>
                <div className="text-sm font-medium text-gray-900">{(item?.product?.salePrice * item?.quantity).toFixed(2)} €</div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sous-total</span>
              <span className="font-medium text-gray-900">{subTotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Expédition</span>
              <div className="text-right">
                <span className="font-medium text-gray-900">{shippingCost.toFixed(2)} €</span>
                <p className="text-[10px] text-gray-500">Standard (7-10 jours)</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6 flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">Total</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">EUR</span>
              <span className="text-2xl font-medium text-gray-900">{totalPrice.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
