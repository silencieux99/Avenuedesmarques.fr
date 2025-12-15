"use client";

import AuthContextProvider, { useAuth } from "@/contexts/AuthContext";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { CircularProgress } from "@nextui-org/react";
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <main>
      <Header />
      <AuthContextProvider>
        <UserChecking>
          <section className="min-h-screen">{children}</section>
        </UserChecking>
      </AuthContextProvider>
      <Footer />
    </main>
  );
}

function UserChecking({ children }) {
  const { user, isLoading } = useAuth();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  // Allow guest checkout
  const isCheckoutPage = pathname.includes('/checkout');

  if (isLoading) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <CircularProgress />
      </div>
    );
  }

  if (!user && !isCheckoutPage) {
    return (
      <div className="h-screen w-full flex flex-col gap-3 justify-center items-center">
        <h1 className="text-sm text-gray-600">Vous n'êtes pas connecté !</h1>
        <Link href={"/login"}>
          <button className="text-white bg-black px-6 py-3 text-sm rounded-lg hover:bg-gray-800 transition-colors">
            Se connecter
          </button>
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
