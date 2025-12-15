"use client";

import { useState, useEffect } from 'react';
import { useCategories } from '@/lib/firestore/categories/read';
import { updateCategory } from '@/lib/firestore/categories/write';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, ChevronDown, FolderOpen, Folder, X, ArrowUpRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

function SortableCategory({ category, children, level = 0, isExpanded, onToggle, onRemoveParent, onMakeChild }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const hasChildren = children && children.length > 0;

    return (
        <div ref={setNodeRef} style={style} className="mb-1">
            <div
                className={`flex items-center gap-2 p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors ${isDragging ? 'shadow-lg' : ''
                    }`}
                style={{ marginLeft: `${level * 24}px` }}
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-gray-200 rounded"
                >
                    <GripVertical size={18} className="text-gray-400" />
                </div>

                {/* Expand/Collapse Button */}
                {hasChildren ? (
                    <button
                        onClick={() => onToggle(category.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                    >
                        {isExpanded ? (
                            <ChevronDown size={18} className="text-gray-600" />
                        ) : (
                            <ChevronRight size={18} className="text-gray-600" />
                        )}
                    </button>
                ) : (
                    <div className="w-[26px]" />
                )}

                {/* Icon */}
                <div className="text-gray-500">
                    {hasChildren ? (
                        isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />
                    ) : (
                        <div className="w-[18px]" />
                    )}
                </div>

                {/* Category Name */}
                <div className="flex-1">
                    <span className="font-medium text-gray-900">{category.name}</span>
                    {category.parentId && (
                        <span className="ml-2 text-xs text-gray-400">(sous-catégorie)</span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {/* Remove from parent button */}
                    {category.parentId && (
                        <button
                            onClick={() => onRemoveParent(category.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded flex items-center gap-1"
                            title="Retirer de la catégorie parente"
                        >
                            <ArrowUpRight size={14} />
                            Sortir
                        </button>
                    )}

                    {/* Edit Link */}
                    <Link
                        href={`/admin/categories?id=${category.id}`}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                        Modifier
                    </Link>
                </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="mt-1">
                    {children.map((child) => (
                        <SortableCategory
                            key={child.category.id}
                            category={child.category}
                            children={child.children}
                            level={level + 1}
                            isExpanded={child.isExpanded}
                            onToggle={onToggle}
                            onRemoveParent={onRemoveParent}
                            onMakeChild={onMakeChild}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CategoryManager() {
    const { data: categories, isLoading } = useCategories();
    const [categoryTree, setCategoryTree] = useState([]);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [dragMode, setDragMode] = useState('reorder'); // 'reorder' or 'nest'

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 8,
            },
        })
    );

    // Build category tree
    useEffect(() => {
        if (!categories) return;

        const buildTree = (parentId = null) => {
            return categories
                .filter(cat => cat.parentId === parentId)
                .map(cat => ({
                    category: cat,
                    children: buildTree(cat.id),
                    isExpanded: expandedIds.has(cat.id),
                }));
        };

        setCategoryTree(buildTree());
    }, [categories, expandedIds]);

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleRemoveParent = async (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        try {
            await updateCategory({
                data: {
                    ...category,
                    parentId: null,
                },
            });
            toast.success(`${category.name} est maintenant une catégorie principale`);
        } catch (error) {
            toast.error('Erreur lors de la modification');
            console.error(error);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const activeCategory = categories.find(c => c.id === active.id);
        const overCategory = categories.find(c => c.id === over.id);

        if (!activeCategory || !overCategory) return;

        // Prevent making a category a child of itself or its own children
        const isDescendant = (parentId, childId) => {
            const parent = categories.find(c => c.id === parentId);
            if (!parent) return false;
            if (parent.parentId === childId) return true;
            if (parent.parentId) return isDescendant(parent.parentId, childId);
            return false;
        };

        if (isDescendant(overCategory.id, activeCategory.id)) {
            toast.error('Impossible : créerait une boucle de catégories');
            return;
        }

        try {
            // Make active category a child of over category
            await updateCategory({
                data: {
                    ...activeCategory,
                    parentId: overCategory.id,
                },
            });
            toast.success(`${activeCategory.name} déplacé sous ${overCategory.name}`);

            // Auto-expand the parent
            setExpandedIds(prev => new Set([...prev, overCategory.id]));
        } catch (error) {
            toast.error('Erreur lors du déplacement');
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Chargement...</div>
            </div>
        );
    }

    const flatCategories = categories || [];

    return (
        <div className="p-5">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Gestion des Catégories</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Glissez une catégorie sur une autre pour créer une sous-catégorie
                    </p>
                </div>
                <Link
                    href="/admin/categories"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Retour à la liste
                </Link>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2 text-blue-900">💡 Comment utiliser :</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Créer une sous-catégorie</strong> : Glissez une catégorie sur une autre</li>
                    <li>• <strong>Retirer une sous-catégorie</strong> : Cliquez sur le bouton "Sortir"</li>
                    <li>• <strong>Sur mobile</strong> : Maintenez appuyé 200ms avant de glisser</li>
                    <li>• <strong>Déplier/Replier</strong> : Cliquez sur les flèches</li>
                </ul>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={flatCategories.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {categoryTree.map((item) => (
                            <SortableCategory
                                key={item.category.id}
                                category={item.category}
                                children={item.children}
                                isExpanded={item.isExpanded}
                                onToggle={toggleExpand}
                                onRemoveParent={handleRemoveParent}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {flatCategories.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    Aucune catégorie trouvée
                </div>
            )}
        </div>
    );
}
