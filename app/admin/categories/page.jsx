"use client";

import CategoryTree from "./components/CategoryTree";

export default function Page() {
  return (
    <main className="p-5 max-w-[1200px] mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestion des Catégories</h1>
        <p className="text-gray-500">Gérez l'arborescence de votre catalogue facilement.</p>
      </div>
      <CategoryTree />
    </main>
  );
}
