"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@nextui-org/react";
import toast from "react-hot-toast";

// Mapping Keywords -> Category ID
const RULES = [
    { keywords: ['robe', 'dress'], catId: 'v5tr9TYq0dQkxI3jqC5P', catName: 'Robes' },
    { keywords: ['sac', 'bag', 'tote', 'clutch', 'handbag', 'besace', 'cabas'], catId: 'OOhesaVSSyNgXiYQMY5p', catName: 'Sacs' },
    { keywords: ['parfum', 'perfume', 'eau de toilette', 'eau de parfum'], catId: '2fXLN5hRk9icRQ85Cqdc', catName: 'Parfums' },
    { keywords: ['manteau', 'veste', 'jacket', 'coat', 'blazer', 'doudoune', 'trench'], catId: 'A4QOu7vblhKWJpgh2XYs', catName: 'Manteaux — Vestes' },
    { keywords: ['ensemble', 'set', 'co-ord'], catId: 'CYlbI86iGz8l3hGszhZ1', catName: 'Ensembles' },
    { keywords: ['haut', 'top', 't-shirt', 'blouse', 'tunique', 'débardeur'], catId: 'GkZyCaf5I1pO2uRzIyjt', catName: 'Hauts' },
    { keywords: ['chemise', 'shirt', 'chemisier'], catId: 'yOo9GbtBg70CWtJvaphK', catName: 'Chemises' },
    { keywords: ['pull', 'sweat', 'hoodie', 'jumper', 'cardigan'], catId: 'aMhIBLLtnwCjwj0eKmA3', catName: 'Pull' },
    { keywords: ['echarpe', 'foulard', 'scarf', 'écharpe'], catId: 'GutypOEFjEX9JjPvS1e1', catName: 'Écharpes' },
    { keywords: ['accessoire', 'ceinture', 'belt', 'lunette', 'sunglasses', 'chapeau', 'bonnet'], catId: 'C7sNv4fUfvq6MAmLaUKm', catName: 'Accessoires' },
];

export default function AuditPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fixing, setFixing] = useState(false);

    async function runAudit() {
        setLoading(true);
        try {
            const catSnap = await getDocs(collection(db, 'categories'));
            const categories = {};
            catSnap.forEach(doc => { categories[doc.id] = doc.data().name; });

            const prodSnap = await getDocs(collection(db, 'products'));
            const products = [];
            prodSnap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

            const distribution = {};
            const orphans = [];
            const fixable = [];

            products.forEach(p => {
                const cId = p.categoryId;
                const catName = categories[cId];

                if (!cId || !catName) {
                    orphans.push({ id: p.id, title: p.title, categoryId: cId });
                } else {
                    distribution[cId] = (distribution[cId] || 0) + 1;
                }

                // Check if fixable
                const lowerTitle = (p.title || "").toLowerCase();
                const rule = RULES.find(r => r.keywords.some(k => lowerTitle.includes(k)));

                // Only suggest fix if currently orphan OR if categorisation seems totally weird (hard to judge)
                // But user said "migration failed", so we can assume we want to enforce rules on EVERYTHING
                if (rule && p.categoryId !== rule.catId) {
                    fixable.push({ product: p, newCatId: rule.catId, newCatName: rule.catName });
                }
            });

            setReport({ categories, distribution, orphans, totalProducts: products.length, fixable });
        } catch (e) {
            console.error(e);
            toast.error("Erreur audit: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        runAudit();
    }, []);

    const handleFix = async () => {
        if (!report?.fixable?.length) return;
        if (!confirm(`Voulez-vous re-catégoriser automatiquement ${report.fixable.length} produits ?`)) return;

        setFixing(true);
        try {
            const batchSize = 500;
            const updates = report.fixable;

            for (let i = 0; i < updates.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = updates.slice(i, i + batchSize);

                chunk.forEach(item => {
                    const ref = doc(db, "products", item.product.id);
                    batch.update(ref, { categoryId: item.newCatId });
                });

                await batch.commit();
            }

            toast.success(`Succès ! ${updates.length} produits mis à jour.`);
            runAudit(); // Refresh
        } catch (e) {
            console.error(e);
            toast.error("Erreur fix: " + e.message);
        }
        setFixing(false);
    };

    if (loading) return <div className="p-10">Audit en cours...</div>;

    return (
        <div className="p-10 max-w-4xl mx-auto bg-white min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Audit des Catégories</h1>
                <Button onClick={runAudit} size="sm" variant="flat">Rafraîchir</Button>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">Distribution ({report.totalProducts} produits)</h2>
                <ul className="space-y-1 max-h-40 overflow-y-auto border p-2 rounded">
                    {Object.keys(report.categories).map(cId => (
                        <li key={cId} className="flex justify-between border-b py-1 last:border-0 border-gray-100">
                            <span>{report.categories[cId]} <span className="text-gray-400 text-xs">({cId})</span></span>
                            <span className={`font-bold ${!report.distribution[cId] ? 'text-red-500' : 'text-green-600'}`}>
                                {report.distribution[cId] || 0}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-blue-700">Réparation Automatique</h2>
                        <p className="text-sm text-blue-600">Basé sur les mots-clés du titre (Robe, Sac, Parfum...)</p>
                    </div>
                    <Button
                        color="primary"
                        isLoading={fixing}
                        isDisabled={report.fixable.length === 0}
                        onClick={handleFix}
                    >
                        Corriger {report.fixable.length} produits
                    </Button>
                </div>
                {report.fixable.length > 0 && (
                    <div className="text-xs text-gray-500 max-h-32 overflow-y-auto">
                        Exemple: {report.fixable[0].product.title} -&gt; {report.fixable[0].newCatName}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold mb-2 text-red-600">Orphelins Restants ({report.orphans.length})</h2>
                <p className="text-sm text-gray-500 mb-4">Produits dont la catégorie n'existe pas et qui n'ont pas été réparés auto.</p>
                {report.orphans.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>CategoryID Actuel</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.orphans.slice(0, 50).map(p => (
                                <tr key={p.id} className="border-b">
                                    <td>{p.title}</td>
                                    <td className="font-mono text-xs">{p.categoryId || "NULL"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-green-600">Aucun produit orphelin.</p>}
            </div>
        </div>
    );
}
