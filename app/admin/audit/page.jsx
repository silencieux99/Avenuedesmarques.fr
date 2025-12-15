"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AuditPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function runAudit() {
            try {
                // 1. Categories
                const catSnap = await getDocs(collection(db, 'categories'));
                const categories = {};
                catSnap.forEach(doc => {
                    categories[doc.id] = doc.data().name;
                });

                // 2. Products
                const prodSnap = await getDocs(collection(db, 'products'));
                const products = [];
                prodSnap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

                // 3. Analysis
                const distribution = {};
                const orphans = [];

                products.forEach(p => {
                    const cId = p.categoryId;
                    if (!cId || !categories[cId]) {
                        orphans.push({ id: p.id, title: p.title, categoryId: cId });
                    } else {
                        distribution[cId] = (distribution[cId] || 0) + 1;
                    }
                });

                setReport({ categories, distribution, orphans, totalProducts: products.length });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        runAudit();
    }, []);

    if (loading) return <div className="p-10">Audit en cours...</div>;

    return (
        <div className="p-10 max-w-4xl mx-auto bg-white min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Audit des Catégories</h1>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">Distribution ({report.totalProducts} produits)</h2>
                <ul className="space-y-1">
                    {Object.keys(report.categories).map(cId => (
                        <li key={cId} className="flex justify-between border-b py-1">
                            <span>{report.categories[cId]} <span className="text-gray-400 text-xs">({cId})</span></span>
                            <span className={`font-bold ${!report.distribution[cId] ? 'text-red-500' : 'text-green-600'}`}>
                                {report.distribution[cId] || 0}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-2 text-red-600">Orphelins ({report.orphans.length})</h2>
                <p className="text-sm text-gray-500 mb-4">Produits dont la catégorie n'existe pas (ID incorrect).</p>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>CategoryID Incorrect</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.orphans.map(p => (
                            <tr key={p.id} className="border-b">
                                <td>{p.title}</td>
                                <td className="font-mono text-xs">{p.categoryId || "NULL"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
