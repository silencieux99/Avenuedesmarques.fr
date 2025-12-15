"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import AuthContextProvider from "@/contexts/AuthContext";
import HeaderClientButtons from "./HeaderClientButtons";
import AdminButton from "./AdminButton";
import { Search, Menu, X, ChevronRight, User } from "lucide-react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuList = [
    {
      name: "Nouveautés",
      link: "/nouveautes",
      featured: true
    },
    {
      name: "Femme",
      link: "/category/femme",
      submenu: [
        { name: "Vêtements", link: "/category/femme/vetements" },
        { name: "Sacs", link: "/category/femme/sacs" },
        { name: "Chaussures", link: "/category/femme/chaussures" },
        { name: "Accessoires", link: "/category/femme/accessoires" },
      ]
    },
    {
      name: "Homme",
      link: "/category/homme",
      submenu: [
        { name: "Vêtements", link: "/category/homme/vetements" },
        { name: "Sacs", link: "/category/homme/sacs" },
        { name: "Chaussures", link: "/category/homme/chaussures" },
        { name: "Accessoires", link: "/category/homme/accessoires" },
      ]
    },
    {
      name: "Collections",
      link: "/collections"
    },
    {
      name: "Marques",
      link: "/brands"
    },
  ];

  return (
    <>
      {/* Top Banner */}
      <div className="fixed top-0 inset-x-0 z-[60] bg-black text-white py-2 text-center">
        <p className="text-[9px] md:text-xs tracking-widest uppercase font-light px-4">
          Livraison gratuite dès 150€ • Retours 30j
        </p>
      </div>

      {/* Main Header */}
      <nav
        className={`fixed top-8 inset-x-0 z-50 transition-all duration-500 ${isScrolled
            ? 'bg-white shadow-lg'
            : 'bg-white/95 backdrop-blur-xl'
          }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left: Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors z-[71]"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" strokeWidth={1.5} />
              ) : (
                <Menu className="w-6 h-6" strokeWidth={1.5} />
              )}
            </button>

            {/* Center: Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="font-serif text-xl md:text-3xl tracking-wider text-gray-900 font-bold whitespace-nowrap">
                L'AVENUE
                <span className="text-accent font-light italic">.</span>
              </h1>
            </Link>

            {/* Right: Action Icons */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-gray-50 rounded-full transition-all"
              >
                <Search className="w-5 h-5 text-gray-700 hover:text-accent transition-colors" strokeWidth={1.5} />
              </button>

              <AuthContextProvider>
                <HeaderClientButtons />
                <Link href="/account" className="hidden md:block p-2 hover:bg-gray-50 rounded-full transition-all">
                  <User className="w-5 h-5 text-gray-700 hover:text-accent transition-colors" strokeWidth={1.5} />
                </Link>
              </AuthContextProvider>
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <div className="border-t border-gray-100 py-4 md:py-6 animate-in slide-in-from-top-4 duration-300">
              <div className="max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder="Rechercher un produit, une marque..."
                  className="w-full px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hamburger Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl animate-in slide-in-from-left duration-300 overflow-y-auto">
            <div className="pt-28 px-6 pb-6 space-y-6">
              {/* Header Menu */}
              <div className="flex items-center justify-between pb-4 border-b">
                <h2 className="font-serif text-2xl font-bold">Menu</h2>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                {menuList.map((item) => (
                  <div key={item.link}>
                    {item.submenu ? (
                      <>
                        <button
                          onClick={() => setExpandedMenu(expandedMenu === item.name ? null : item.name)}
                          className={`w-full px-4 py-3 rounded-lg transition-all flex items-center justify-between ${item.featured
                              ? 'bg-accent text-white font-semibold'
                              : 'hover:bg-gray-50'
                            }`}
                        >
                          <span>{item.name}</span>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${expandedMenu === item.name ? 'rotate-90' : ''
                              }`}
                          />
                        </button>
                        {expandedMenu === item.name && (
                          <div className="ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.link}
                                href={subItem.link}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <div className="px-4 py-2.5 text-sm text-gray-600 hover:text-accent hover:bg-gray-50 rounded-lg transition-all">
                                  {subItem.name}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link href={item.link} onClick={() => setIsMobileMenuOpen(false)}>
                        <div className={`px-4 py-3 rounded-lg transition-all ${item.featured
                            ? 'bg-accent text-white font-semibold'
                            : 'hover:bg-gray-50'
                          }`}>
                          {item.name}
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* User Actions */}
              <AuthContextProvider>
                <div className="pt-6 border-t space-y-2">
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-all">
                      <User className="w-5 h-5" />
                      <span>Mon Compte</span>
                    </div>
                  </Link>
                  <div className="px-4 py-2">
                    <AdminButton />
                  </div>
                  <div className="px-4 py-2">
                    <LogoutButton />
                  </div>
                </div>
              </AuthContextProvider>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
