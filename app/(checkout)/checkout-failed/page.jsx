export const dynamic = "force-dynamic";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import { adminDB } from "@/lib/firebase_admin";
import Link from "next/link";

const fetchCheckout = async (checkoutId) => {
  const list = await adminDB
    .collectionGroup("checkout_sessions")
    .where("id", "==", checkoutId)
    .get();
  if (list.docs.length === 0) {
    throw new Error("Invalid Checkout ID");
  }
  return list.docs[0].data();
};

export default async function Page({ searchParams }) {
  const { checkout_id } = searchParams;
  const checkout = await fetchCheckout(checkout_id);
  return (
    <main>
      <Header />
      <section className="min-h-screen pt-28 flex flex-col gap-3 justify-center items-center">
        <div className="flex justify-center w-full">
          <img src="/svgs/Mobile payments-rafiki.svg" className="h-48" alt="" />
        </div>
        <h1 className="text-2xl font-semibold text-red-600">Le paiement a échoué</h1>
        <p className="text-gray-600">Une erreur s'est produite lors du paiement</p>
        <div className="flex items-center gap-4 text-sm">
          <Link href={"/"}>
            <button className="text-black border border-black px-6 py-3 rounded-lg bg-white hover:bg-gray-50 transition-colors">
              Retour à l'accueil
            </button>
          </Link>
          <Link href={checkout?.url}>
            <button className="bg-black px-6 py-3 rounded-lg text-white hover:bg-gray-800 transition-colors">
              Réessayer
            </button>
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
