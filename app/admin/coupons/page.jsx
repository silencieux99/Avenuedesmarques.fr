import Link from "next/link";
import ListView from "./components/ListView";
import { Plus } from "lucide-react";

export default function Page() {
    return (
        <main className="flex flex-col gap-4 p-5">
            <div className="flex justify-between items-center">
                <h1 className="text-xl">Codes Promo</h1>
                <Link href={`/admin/coupons/form`}>
                    <button className="bg-[#313131] text-sm text-white px-4 py-2 rounded-lg hover:bg-[#414141] transition-colors flex items-center gap-2">
                        <Plus size={16} />
                        Ajouter un code
                    </button>
                </Link>
            </div>
            <ListView />
        </main>
    );
}
