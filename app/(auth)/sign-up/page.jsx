"use client";

import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { createUser } from "@/lib/firestore/user/write";
import { Button } from "@nextui-org/react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Page() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({});

  const handleData = (key, value) => {
    setData({
      ...data,
      [key]: value,
    });
  };
  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        data?.email,
        data?.password
      );
      await updateProfile(credential.user, {
        displayName: data?.name,
      });
      const user = credential.user;
      await createUser({
        uid: user?.uid,
        displayName: data?.name,
        photoURL: user?.photoURL,
      });
      toast.success("Successfully Sign Up");
      router.push("/account");
    } catch (error) {
      toast.error(error?.message);
    }
    setIsLoading(false);
  };

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-gray-50 px-4 py-20">
      <section className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <Link href="/">
              <h1 className="font-serif text-2xl font-bold tracking-wider text-gray-900 mx-auto w-fit cursor-pointer">
                L'AVENUE<span className="text-accent">.</span>
              </h1>
            </Link>
            <p className="text-gray-500 text-sm tracking-wide uppercase">Créer un nouveau compte</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignUp();
            }}
            className="flex flex-col gap-5"
          >
            <div className="space-y-4">
              <input
                placeholder="Nom complet"
                type="text"
                name="user-name"
                id="user-name"
                value={data?.name}
                onChange={(e) => handleData("name", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent focus:bg-white transition-all"
                required
              />
              <input
                placeholder="Email"
                type="email"
                name="user-email"
                id="user-email"
                value={data?.email}
                onChange={(e) => handleData("email", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent focus:bg-white transition-all"
                required
              />
              <input
                placeholder="Mot de passe"
                type="password"
                name="user-password"
                id="user-password"
                value={data?.password}
                onChange={(e) => handleData("password", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent focus:bg-white transition-all"
                required
              />
            </div>

            <Button
              isLoading={isLoading}
              isDisabled={isLoading}
              type="submit"
              className="w-full bg-black text-white py-6 rounded-lg font-medium tracking-widest uppercase text-xs hover:bg-gray-800 transition-all"
            >
              S'inscrire
            </Button>
          </form>

          <div className="flex items-center justify-center text-xs text-gray-500 font-medium">
            <span className="mr-2">Déjà un compte ?</span>
            <Link href="/login" className="text-accent hover:text-accent/80 transition-colors font-bold uppercase tracking-wide border-b border-transparent hover:border-accent pb-0.5">
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
