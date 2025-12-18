"use client";

import { useState } from "react";
import { useCategories } from "@/lib/firestore/categories/read";
import { deleteCategory } from "@/lib/firestore/categories/write";
import { Button, Card, Spinner, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { Plus, MoreVertical, Edit, Trash, ChevronRight, ChevronDown } from "lucide-react";
import CategoryModal from "./CategoryModal";
import toast from "react-hot-toast";

export default function CategoryTree() {
    const { data: categories, isLoading } = useCategories();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newParentId, setNewParentId] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState({});

    // Build hierarchy
    const buildTree = (cats) => {
        const idMap = {};
        const roots = [];
        cats.forEach(c => idMap[c.id] = { ...c, children: [] });
        cats.forEach(c => {
            if (c.parentId && idMap[c.parentId]) {
                idMap[c.parentId].children.push(idMap[c.id]);
            } else {
                roots.push(idMap[c.id]);
            }
        });
        // Sort by rank or name
        const sortFn = (a, b) => (a.rank || 999) - (b.rank || 999);
        roots.sort(sortFn);
        Object.values(idMap).forEach(node => node.children.sort(sortFn));
        return roots;
    };

    const treeData = categories ? buildTree(categories) : [];

    const toggleExpand = (id) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreateRoot = () => {
        setEditingCategory(null);
        setNewParentId(null);
        setIsModalOpen(true);
    };

    const handleCreateSub = (parentId) => {
        setEditingCategory(null);
        setNewParentId(parentId);
        setIsModalOpen(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setNewParentId(category.parentId);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ? Cela n'effacera pas les produits mais les rendra orphelins.")) {
            try {
                await deleteCategory({ id });
                toast.success("Catégorie supprimée");
            } catch (e) {
                toast.error(e.message);
            }
        }
    };

    const TreeNode = ({ node, depth = 0 }) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes[node.id];

        return (
            <div className="flex flex-col select-none">
                <div
                    className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 border-b border-gray-50 transition-colors ${depth > 0 ? "ml-6 border-l border-gray-100" : ""}`}
                >
                    <button
                        onClick={() => toggleExpand(node.id)}
                        className={`p-1 rounded hover:bg-gray-200 text-gray-500 ${hasChildren ? "visible" : "invisible"}`}
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="flex items-center gap-3 flex-1">
                        {node.imageURL && (
                            <img src={node.imageURL} alt="" className="w-8 h-8 rounded object-cover border border-gray-100" />
                        )}
                        <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-800">{node.name}</span>
                            <span className="text-[10px] text-gray-400">{node.slug}</span>
                        </div>
                        {node.rank && <Chip size="sm" variant="flat" className="text-[10px] h-5">Rang: {node.rank}</Chip>}
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly size="sm" variant="light"
                            onClick={() => handleCreateSub(node.id)}
                            title="Ajouter une sous-catégorie"
                        >
                            <Plus size={16} />
                        </Button>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light"><MoreVertical size={16} /></Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Actions">
                                <DropdownItem startContent={<Edit size={14} />} onPress={() => handleEdit(node)}>Modifier</DropdownItem>
                                <DropdownItem startContent={<Trash size={14} />} className="text-danger" color="danger" onPress={() => handleDelete(node.id)}>Supprimer</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="flex flex-col">
                        {node.children.map(child => (
                            <TreeNode key={child.id} node={child} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) return <div className="flex justify-center p-10"><Spinner /></div>;

    return (
        <Card className="p-6 min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Arborescence</h2>
                <Button color="primary" startContent={<Plus size={18} />} onPress={handleCreateRoot}>
                    Nouvelle Catégorie Racine
                </Button>
            </div>

            <div className="flex flex-col gap-1">
                {treeData.map(node => (
                    <TreeNode key={node.id} node={node} />
                ))}
            </div>

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                categoryToEdit={editingCategory}
                parentIdForNew={newParentId}
                allCategories={categories}
            />
        </Card>
    );
}
