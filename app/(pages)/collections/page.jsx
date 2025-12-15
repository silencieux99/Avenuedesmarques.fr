import { getCollections } from "@/lib/firestore/collections/read_server";
import Link from "next/link";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
    const collections = await getCollections();

    return (
        <main className="min-h-screen py-10 px-4 md:px-8 max-w-[1600px] mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="font-serif text-3xl md:text-4xl font-bold uppercase tracking-wide">
                    Nos Collections
                </h1>
                <div className="h-1 w-20 bg-accent mx-auto" />
            </div>

            {collections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection) => (
                        <Link
                            key={collection.id}
                            href={`/collections/${collection.id}`}
                            className="group relative h-80 md:h-96 w-full overflow-hidden rounded-xl border bg-gray-100"
                        >
                            <Image
                                src={collection.imageURL}
                                alt={collection.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                <h2 className="text-2xl font-bold uppercase tracking-widest bg-black/50 px-4 py-2 backdrop-blur-sm rounded">
                                    {collection.title}
                                </h2>
                                <span className="mt-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 bg-white text-black px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded-full">
                                    Découvrir
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    Aucune collection disponible pour le moment.
                </div>
            )}
        </main>
    );
}
