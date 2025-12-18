"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { createNewCategory, updateCategory } from "@/lib/firestore/categories/write";
import toast from "react-hot-toast";

export default function CategoryModal({ isOpen, onClose, categoryToEdit, parentIdForNew, allCategories }) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [parentId, setParentId] = useState("");
    const [image, setImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (categoryToEdit) {
            setName(categoryToEdit.name);
            setSlug(categoryToEdit.slug);
            setParentId(categoryToEdit.parentId || "");
            setImage(null); // Reset image input
        } else {
            // New Category
            setName("");
            setSlug("");
            setParentId(parentIdForNew || "");
            setImage(null);
        }
    }, [categoryToEdit, parentIdForNew, isOpen]);

    const handleNameChange = (val) => {
        setName(val);
        if (!categoryToEdit) {
            // Auto-slugify
            setSlug(val.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
            );
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const payload = {
                name,
                slug,
                parentId: parentId === "" ? null : parentId,
            };

            if (categoryToEdit) {
                payload.id = categoryToEdit.id;
                // Preserve existing image if no new one
                payload.imageURL = categoryToEdit.imageURL;
                await updateCategory({ data: payload, image });
                toast.success("Catégorie mise à jour !");
            } else {
                // For new category, check image requirement
                // If the write function strictly requires it, we must provide it.
                // Assuming write.jsx requires it:
                if (!image) {
                    // Temporary quick fix since user said "it's too hard", maybe they skip image?
                    // But write.jsx throws. We'll prompt user.
                    throw new Error("Veuillez ajouter une image");
                }
                await createNewCategory({ data: payload, image });
                toast.success("Catégorie créée !");
            }
            onClose();
        } catch (error) {
            toast.error(error.message);
        }
        setIsLoading(false);
    };

    // Filter available parents (cannot be itself)
    const availableParents = allCategories?.filter(c => c.id !== categoryToEdit?.id) || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>{categoryToEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-4">
                        <Input
                            label="Nom"
                            placeholder="Ex: Vêtements"
                            value={name}
                            onValueChange={handleNameChange}
                        />
                        <Input
                            label="Slug (URL)"
                            value={slug}
                            onValueChange={setSlug}
                        />
                        <Select
                            label="Catégorie Parente"
                            selectedKeys={parentId ? [parentId] : []}
                            onChange={(e) => setParentId(e.target.value)}
                        >
                            <SelectItem key="" value="">(Aucune - Racine)</SelectItem>
                            {availableParents.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </Select>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-500">Image</label>
                            <input
                                type="file"
                                onChange={(e) => setImage(e.target.files[0])}
                                className="text-sm"
                            />
                            {categoryToEdit?.imageURL && !image && (
                                <div className="text-xs text-green-600">Image actuelle conservée</div>
                            )}
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>Annuler</Button>
                    <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                        {categoryToEdit ? "Enregistrer" : "Créer"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
