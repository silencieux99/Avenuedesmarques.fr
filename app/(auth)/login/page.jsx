"use client";

import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { createUser } from "@/lib/firestore/user/write";
import { Button } from "@nextui-org/react";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
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

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data?.email, data?.password);
      toast.success("Logged In Successfully");
    } catch (error) {
      toast.error(error?.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      router.push("/account");
    }
  }, [user]);

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
            <p className="text-gray-500 text-sm tracking-wide uppercase">Connexion à votre espace</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="flex flex-col gap-5"
          >
            <div className="space-y-4">
              <input
                placeholder="Email"
                type="email"
                name="user-email"
                id="user-email"
                value={data?.email ?? ""}
                onChange={(e) => handleData("email", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent focus:bg-white transition-all"
                required
                aria-label="Email"
              />
              <input
                placeholder="Mot de passe"
                type="password"
                name="user-password"
                id="user-password"
                value={data?.password ?? ""}
                onChange={(e) => handleData("password", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent focus:bg-white transition-all"
                required
                aria-label="Mot de passe"
              />
            </div>

            <Button
              isLoading={isLoading}
              isDisabled={isLoading}
              type="submit"
              className="w-full bg-black text-white py-6 rounded-lg font-medium tracking-widest uppercase text-xs hover:bg-gray-800 transition-all"
            >
              Se connecter
            </Button>
          </form>

          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <Link href="/sign-up" className="hover:text-accent transition-colors border-b border-transparent hover:border-accent pb-0.5">
              Créer un compte
            </Link>
            <Link href="/forget-password" className="hover:text-accent transition-colors border-b border-transparent hover:border-accent pb-0.5">
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400">Ou continuez avec</span>
            </div>
          </div>

          <SignInWithGoogleComponent />
        </div>
      </section>
    </main>
  );
}

function SignInWithGoogleComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = credential.user;
      await createUser({
        uid: user?.uid,
        displayName: user?.displayName,
        photoURL: user?.photoURL,
      });
    } catch (error) {
      toast.error(error?.message);
    }
    setIsLoading(false);
  };
  return (
    <Button
      isLoading={isLoading}
      isDisabled={isLoading}
      onPress={handleLogin}
      className="w-full bg-white text-gray-700 border border-gray-200 py-6 rounded-lg font-medium text-xs tracking-wider uppercase hover:bg-gray-50 hover:border-gray-300 transition-all"
    >
      Continuer avec Google
    </Button>
  );
}
