import Link from "next/link";
import ListView from "./components/ListView";

export default function Page() {
  return (
    <main className="flex flex-col gap-4 p-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl">Produits</h1>
        <div className="flex gap-3">
          <Link href={`/admin/products/ai-create`}>
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-sm text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              Créer avec l'IA
            </button>
          </Link>
          <Link href={`/admin/products/form`}>
            <button className="bg-[#313131] text-sm text-white px-4 py-2 rounded-lg hover:bg-[#414141] transition-colors">
              Créer manuellement
            </button>
          </Link>
        </div>
      </div>
      <ListView />
    </main>
  );
}
