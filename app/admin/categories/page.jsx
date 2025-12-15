"use client";

import Link from "next/link";
import Form from "./components/Form";
import ListView from "./components/ListView";

export default function Page() {
  return (
    <main className="p-5 flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Catégories</h1>
        <Link
          href="/admin/categories/manage"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18" />
            <path d="m8 14 4 4 4-4" />
            <path d="m8 10 4-4 4 4" />
          </svg>
          Gérer l'ordre
        </Link>
      </div>
      <div className="flex flex-col md:flex-row gap-5">
        <Form />
        <ListView />
      </div>
    </main>
  );
}
