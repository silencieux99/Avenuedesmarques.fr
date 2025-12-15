"use client";

import { useState } from 'react';
import { useCategories } from '@/lib/firestore/categories/read';
import { updateCategory } from '@/lib/firestore/categories/write';
import { ChevronRight, Folder, FolderOpen, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function CategoryManager() {
    const { data: categories, isLoading } = useCategories();
    const [selectedParentId, setSelectedParentId] = useState(null);

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Chargement...</div>;
    }

    // Grouper et trier les catégories
    const sortCategories = (cats) => {
        return cats?.sort((a, b) => (a.rank || 0) - (b.rank || 0)); // Tri par rank par défaut
    };

    const rootCategories = sortCategories(categories?.filter(c => !c.parentId)) || [];
    const childCategories = sortCategories(categories?.filter(c => c.parentId === selectedParentId)) || [];

    // Fonction pour changer le parent
    const handleAssignParent = async (categoryId, newParentId) => {
        try {
            if (categoryId === newParentId) return; // Impossible d'être son propre parent

            const category = categories.find(c => c.id === categoryId);
            await updateCategory({
                data: { ...category, parentId: newParentId }
            });
            toast.success('Structure mise à jour !');
        } catch (error) {
            toast.error('Erreur lors du déplacement');
            console.error(error);
        }
    };

    // Fonction de réorganisation (Monter/Descendre)
    const handleMove = async (category, direction) => {
        const isRoot = !category.parentId;
        const siblings = isRoot
            ? rootCategories
            : sortCategories(categories.filter(c => c.parentId === category.parentId));

        const currentIndex = siblings.findIndex(c => c.id === category.id);
        if (currentIndex === -1) return;

        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= siblings.length) return;

        // Swap ranks
        const newSiblings = [...siblings];
        // On force un recalcul de tous les ranks pour être sûr
        // On échange d'abord dans le tableau temporaire
        [newSiblings[currentIndex], newSiblings[newIndex]] = [newSiblings[newIndex], newSiblings[currentIndex]];

        // On sauvegarde tout
        try {
            await Promise.all(newSiblings.map((cat, idx) =>
                updateCategory({ data: { ...cat, rank: idx } })
            ));
            toast.success('Ordre mis à jour');
        } catch (error) {
            toast.error('Erreur de sauvegarde');
            console.error(error);
        }
    };


    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold font-serif">Organisation & Ordre du Menu</h1>
                    <p className="text-sm text-gray-500 mt-1">Utilisez les flèches pour réorganiser l'ordre d'affichage.</p>
                </div>
                <Link
                    href="/admin/categories"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Retour
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-200px)]">

                {/* COLONNE GAUCHE : Catégories Principales */}
                <div className="bg-white border rounded-xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 bg-gray-50 border-b font-medium text-gray-700 flex justify-between items-center">
                        <span>📂 Menu Principal (Racine)</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{rootCategories.length}</span>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {rootCategories.map((cat, idx) => (
                            <div
                                key={cat.id}
                                onClick={() => setSelectedParentId(cat.id)}
                                className={`
                  flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all group
                  ${selectedParentId === cat.id
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-200'
                                        : 'hover:bg-gray-50 text-gray-700 border border-transparent'}
                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMove(cat, -1); }}
                                            className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                                            disabled={idx === 0}
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMove(cat, 1); }}
                                            className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                                            disabled={idx === rootCategories.length - 1}
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                    </div>
                                    {selectedParentId === cat.id ? <FolderOpen size={20} /> : <Folder size={20} />}
                                    <div className="flex flex-col">
                                        <span className="font-medium">{cat.name}</span>
                                        <span className="text-[10px] text-gray-400">Position : {cat.rank ?? idx}</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`text-gray-400 ${selectedParentId === cat.id ? 'text-blue-500' : ''}`} />
                            </div>
                        ))}

                        {/* Zone Warning Orphelins */}
                        <div className="mt-4 pt-4 border-t px-2">
                            {categories?.filter(c => c.parentId && !rootCategories.find(r => r.id === c.parentId) && !categories.find(p => p.id === c.parentId)).map(orphan => (
                                <div key={orphan.id} className="p-2 bg-red-50 text-red-600 rounded mb-1 text-sm flex justify-between items-center">
                                    <span>⚠️ {orphan.name} (Parent manquant)</span>
                                    <button
                                        onClick={() => handleAssignParent(orphan.id, null)}
                                        className="text-xs bg-white border border-red-200 px-2 py-1 rounded hover:bg-red-100"
                                    >
                                        Mettre en racine
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE : Sous-catégories / Contenu */}
                <div className="bg-white border rounded-xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 bg-gray-50 border-b font-medium text-gray-700 flex items-center gap-2">
                        <span>↳ Sous-menu de</span>
                        <span className="font-bold text-blue-600">
                            {categories?.find(c => c.id === selectedParentId)?.name || '...'}
                        </span>
                    </div>

                    <div className="overflow-y-auto flex-1 p-4 bg-gray-50/50">
                        {selectedParentId ? (
                            <div className="space-y-4">
                                {/* 1. Liste des enfants actuels */}
                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                    <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Éléments du sous-menu :</h3>
                                    {childCategories.length > 0 ? (
                                        <div className="space-y-2">
                                            {childCategories.map((child, idx) => (
                                                <div key={child.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border group hover:border-blue-300 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col opacity-50 group-hover:opacity-100">
                                                            <button onClick={() => handleMove(child, -1)} className="hover:text-blue-600 disabled:opacity-30" disabled={idx === 0}><ArrowUp size={12} /></button>
                                                            <button onClick={() => handleMove(child, 1)} className="hover:text-blue-600 disabled:opacity-30" disabled={idx === childCategories.length - 1}><ArrowDown size={12} /></button>
                                                        </div>
                                                        <span className="font-medium">{child.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAssignParent(child.id, null)}
                                                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                                    >
                                                        Sortir
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic text-center py-4">Aucune sous-catégorie pour le moment.</p>
                                    )}
                                </div>

                                {/* 2. Ajouter d'autres catégories ici */}
                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                    <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Ajouter à ce dossier :</h3>
                                    <select
                                        className="w-full p-2 border rounded-lg text-sm mb-2"
                                        onChange={(e) => {
                                            if (e.target.value) handleAssignParent(e.target.value, selectedParentId);
                                            e.target.value = ""; // reset
                                        }}
                                    >
                                        <option value="">+ Choisir une catégorie à déplacer ici...</option>
                                        {rootCategories
                                            .filter(c => c.id !== selectedParentId) // Pas soi-même
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                    </select>
                                    <p className="text-xs text-gray-400">
                                        Sélectionnez une catégorie principale pour la déplacer à l'intérieur de <strong>{categories?.find(c => c.id === selectedParentId)?.name}</strong>.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center p-8">
                                <FolderOpen size={48} className="mb-4 text-gray-200" />
                                <p>Sélectionnez une catégorie à gauche<br />pour gérer son contenu.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
