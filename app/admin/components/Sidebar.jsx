"use client";

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  Cat,
  Layers2,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  PackageOpen,
  ShieldCheck,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";

export default function Sidebar() {
  const menuList = [
    { name: "Tableau de bord", link: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    { name: "Produits", link: "/admin/products", icon: <PackageOpen className="h-4 w-4" /> },
    { name: "Catégories", link: "/admin/categories", icon: <Layers2 className="h-4 w-4" /> },
    { name: "Marques", link: "/admin/brands", icon: <Cat className="h-4 w-4" /> },
    { name: "Commandes", link: "/admin/orders", icon: <ShoppingBag className="h-4 w-4" /> },
    { name: "Clients", link: "/admin/customers", icon: <Users className="h-4 w-4" /> },
    { name: "Avis", link: "/admin/reviews", icon: <Star className="h-4 w-4" /> },
    { name: "Collections", link: "/admin/collections", icon: <LibraryBig className="h-4 w-4" /> },
    { name: "Carrousel (Hero)", link: "/admin/hero", icon: <Star className="h-4 w-4" /> },
    { name: "Admins", link: "/admin/admins", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <section className="sticky top-0 flex flex-col gap-8 bg-[#0a0a0a] text-white border-r border-[#222] px-4 py-6 h-screen overflow-hidden w-[260px] z-50">
      <div className="flex justify-center py-2">
        <Link href={`/`}>
          <h1 className="font-serif text-2xl tracking-wide font-bold uppercase">
            AVENUE<span className="text-accent">.</span>
          </h1>
        </Link>
      </div>
      <ul className="flex-1 h-full overflow-y-auto flex flex-col gap-2">
        {menuList?.map((item, key) => {
          return <Tab item={item} key={key} />;
        })}
      </ul>
      <div className="flex justify-center border-t border-[#222] pt-4">
        <button
          onClick={async () => {
            try {
              await toast.promise(signOut(auth), {
                error: (e) => e?.message,
                loading: "Déconnexion...",
                success: "Déconnecté",
              });
            } catch (error) {
              toast.error(error?.message);
            }
          }}
          className="flex gap-3 items-center px-4 py-3 hover:bg-white/5 rounded-lg w-full text-sm font-medium transition-all text-gray-400 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>
    </section>
  );
}

function Tab({ item }) {
  const pathname = usePathname();
  const isSelected = pathname === item?.link;
  return (
    <Link href={item?.link}>
      <li
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
        ${isSelected ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-gray-400 hover:text-white hover:bg-white/5"} 
        `}
      >
        {item?.icon} {item?.name}
      </li>
    </Link>
  );
}
