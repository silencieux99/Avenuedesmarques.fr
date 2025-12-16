"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import AuthContextProvider from "@/contexts/AuthContext";
import HeaderClientButtons from "./HeaderClientButtons";
import AdminButton from "./AdminButton";
import { Search, Menu, X, ChevronRight, User } from "lucide-react";

import { useCategories } from "@/lib/firestore/categories/read";

// Helper to build category tree
function buildCategoryTree(categories) {
  const categoryMap = {};
  const roots = [];

  // 1. Initialize map
  categories.forEach((cat) => {
    categoryMap[cat.id] = { ...cat, submenu: [] };
  });

  // 2. Build tree
  categories.forEach((cat) => {
    if (cat.parentId && categoryMap[cat.parentId]) {
      categoryMap[cat.parentId].submenu.push(categoryMap[cat.id]);
    } else {
      roots.push(categoryMap[cat.id]);
    }
  });

  // 3. Sort roots and submenus by rank
  const sortByRank = (a, b) => (a.rank || 0) - (b.rank || 0);
  roots.sort(sortByRank);

  Object.values(categoryMap).forEach(cat => {
    if (cat.submenu.length > 0) {
      cat.submenu.sort(sortByRank);
    }
  });

  return roots;
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState({}); // Changed to object for multi-level expansion
  const { data: categories } = useCategories();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dynamicCategories = categories ? buildCategoryTree(categories) : [];

  const staticMenu = [
    {
      name: "Nouveautés",
      link: "/nouveautes",
      featured: true,
    },
    ...dynamicCategories.map(cat => ({
      name: cat.name,
      link: `/category/${cat.slug}`, // Use slug for link
      submenu: cat.submenu.length > 0 ? cat.submenu.map(sub => ({
        name: sub.name,
        link: `/category/${cat.slug}/${sub.slug}`,
        submenu: sub.submenu.length > 0 ? sub.submenu.map(subSub => ({
          name: subSub.name,
          link: `/category/${cat.slug}/${sub.slug}/${subSub.slug}`
        })) : null
      })) : null
    })),
    {
      name: "Collections",
      link: "/collections",
      featured: false,
    },
    {
      name: "Marques",
      link: "/brands",
      featured: false,
    },
  ];

  const menuList = staticMenu;

  const toggleExpand = (name) => {
    setExpandedMenu(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  }

  return (
    <>
      {/* Top Banner */}
      <div className="fixed top-0 inset-x-0 z-[60] bg-black text-white py-2 text-center">
        <p className="text-[9px] md:text-xs tracking-widest uppercase font-light px-4">
          Nouveautés chaque semaine • Retours 30j
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
            {/* Left: Menu Hamburger & Search */}
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors z-[71]"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" strokeWidth={1.5} />
                ) : (
                  <Menu className="w-6 h-6" strokeWidth={1.5} />
                )}
              </button>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Ouvrir la recherche"
                className="p-2 hover:bg-gray-50 rounded-full transition-all"
              >
                <Search className="w-5 h-5 text-gray-700 hover:text-accent transition-colors" strokeWidth={1.5} />
              </button>
            </div>

            {/* Center: Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="font-serif text-xl md:text-3xl tracking-wider text-gray-900 font-bold whitespace-nowrap">
                L'AVENUE
                <span className="text-accent font-light italic">.</span>
              </h1>
            </Link>

            {/* Right: Action Icons */}
            <div className="flex items-center gap-2 md:gap-3">
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
                  aria-label="Rechercher"
                  className="w-full px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hamburger Menu - Amirat Style */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[70] flex">
          {/* Menu Panel */}
          <div className="relative w-full max-w-[320px] bg-white h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">

            {/* Header: Close Button */}
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Fermer le menu"
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-black" strokeWidth={1} />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">

              {/* Search Bar Mobile */}
              <div className="mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    aria-label="Rechercher dans le menu"
                    className="w-full border-b border-black py-2 pl-0 pr-8 text-black placeholder-gray-500 focus:outline-none focus:border-black rounded-none"
                  />
                  <Search className="w-4 h-4 absolute right-0 top-3 text-black" />
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-4">
                {menuList.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-none pb-2">
                    {item.submenu ? (
                      <>
                        <button
                          onClick={() => toggleExpand(item.name)}
                          className="w-full py-2 flex items-center justify-between text-left group"
                        >
                          <span className={`text-base uppercase tracking-widest font-medium ${item.featured ? 'text-accent' : 'text-black'}`}>
                            {item.name}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform duration-300 ${expandedMenu[item.name] ? "rotate-90" : ""}`}
                          />
                        </button>

                        {/* Level 2 Submenu */}
                        <div className={`grid transition-all duration-300 ease-in-out ${expandedMenu[item.name] ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="overflow-hidden">
                            <div className="flex flex-col gap-2 pl-4 pb-2 border-l border-zinc-200 ml-1">
                              {item.submenu.map((subItem, subIndex) => (
                                <div key={subIndex}>
                                  {subItem.submenu ? (
                                    <>
                                      <button
                                        onClick={() => toggleExpand(subItem.name)}
                                        className="w-full py-1 flex items-center justify-between text-sm text-gray-600 hover:text-black"
                                      >
                                        <span>{subItem.name}</span>
                                        <ChevronRight
                                          className={`w-3 h-3 transition-transform ${expandedMenu[subItem.name] ? "rotate-90" : ""}`}
                                        />
                                      </button>
                                      {/* Level 3 Submenu */}
                                      {expandedMenu[subItem.name] && (
                                        <div className="flex flex-col gap-2 mt-2 ml-3 border-l border-zinc-100 pl-3">
                                          {subItem.submenu.map((subSub, ssIdx) => (
                                            <Link key={ssIdx} href={subSub.link} onClick={() => setIsMobileMenuOpen(false)}>
                                              <span className="text-xs text-gray-500 hover:text-black block py-1">{subSub.name}</span>
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <Link
                                      href={subItem.link}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className="block py-1 text-sm text-gray-600 hover:text-black hover:translate-x-1 transition-transform"
                                    >
                                      {subItem.name}
                                    </Link>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <Link
                        href={item.link}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block py-2 text-base uppercase tracking-widest font-medium ${item.featured ? 'text-accent' : 'text-black'}`}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* User Links */}
              <AuthContextProvider>
                <div className="mt-10 pt-6 border-t border-gray-100 space-y-4">
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-black">
                    <User className="w-4 h-4" />
                    Mon Compte
                  </Link>
                  <div className="pt-2">
                    <AdminButton />
                  </div>
                  <div className="pt-2">
                    <LogoutButton />
                  </div>
                </div>
              </AuthContextProvider>
            </div>

            {/* Footer / Socials (Optional placeholder) */}
            <div className="p-6 bg-gray-50 text-center text-xs text-gray-400 uppercase tracking-widest">
              L'AVENUE © 2025
            </div>

          </div>

          {/* Overlay Click to Close */}
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}
    </>
  );
}
