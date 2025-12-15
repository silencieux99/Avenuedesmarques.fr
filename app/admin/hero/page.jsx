"use client";

import { useState } from "react";
import { useHeroSlides } from "@/lib/firestore/hero/read";
import { createHeroSlide, updateHeroSlide, deleteHeroSlide } from "@/lib/firestore/hero/write";
import { Button, Input, Card, CardBody, Image } from "@nextui-org/react";
import { Trash2, Upload, GripVertical, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function HeroAdminPage() {
    const { data: slides, isLoading } = useHeroSlides();
    const [isUploading, setIsUploading] = useState(false);

    // New Slide Form State
    const [newImage, setNewImage] = useState(null);
    const [newLink, setNewLink] = useState("");
    const [newTitle, setNewTitle] = useState("");

    const handleAddSlide = async () => {
        if (!newImage) {
            toast.error("Veuillez sélectionner une image");
            return;
        }

        setIsUploading(true);
        try {
            await createHeroSlide({
                data: {
                    link: newLink,
                    title: newTitle,
                    rank: slides?.length || 0
                },
                imageFile: newImage
            });
            toast.success("Slide ajouté !");
            // Reset form
            setNewImage(null);
            setNewLink("");
            setNewTitle("");
        } catch (error) {
            toast.error("Erreur : " + error.message);
        }
        setIsUploading(false);
    };

    const handleDelete = async (id) => {
        if (confirm("Supprimer ce slide ?")) {
            try {
                await deleteHeroSlide(id);
                toast.success("Supprimé");
            } catch (e) {
                toast.error("Erreur suppression");
            }
        }
    };

    const handleMove = async (slide, direction) => {
        if (!slides) return;
        const index = slides.findIndex(s => s.id === slide.id);
        if (index === -1) return;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= slides.length) return;

        // Swap ranks
        const neighbor = slides[newIndex];
        if (!neighbor) return;

        // Temporarily optimistic UI update is hard with SWR revalidation properly without local state mutation
        // So we just fire updates
        try {
            await Promise.all([
                updateHeroSlide({ data: { id: slide.id, rank: index + direction } }), // Swap ranks logic implies we swap values actually
                // Simplified: Just re-assign ranks based on new array order
            ]);

            // Better logic: Swap the two items in a copy array, then update ALL ranks
            const newSlides = [...slides];
            [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];

            await Promise.all(newSlides.map((s, idx) =>
                updateHeroSlide({ data: { id: s.id, rank: idx } })
            ));

            toast.success("Ordre mis à jour");
        } catch (e) {
            toast.error("Erreur de tri");
        }
    };

    if (isLoading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold font-serif mb-2">Gestion du Carrousel (Hero)</h1>
                <p className="text-gray-500">Ajoutez les images qui défilent sur la page d'accueil.</p>
            </div>

            {/* Formulaire d'ajout */}
            <Card className="p-4 border shadow-sm">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Upload size={20} /> Ajouter une nouvelle image
                </h2>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        {/* Image Preview / Input */}
                        <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center min-h-[150px] bg-gray-50 relative group cursor-pointer transition-colors hover:bg-gray-100">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={(e) => e.target.files[0] && setNewImage(e.target.files[0])}
                            />
                            {newImage ? (
                                <img src={URL.createObjectURL(newImage)} className="h-40 w-full object-cover rounded-lg" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <Upload className="mx-auto mb-2" />
                                    <span className="text-sm">Cliquez pour choisir une image</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <Input
                            label="Titre (Optionnel)"
                            placeholder="Ex: Nouvelle Collection"
                            value={newTitle}
                            onValueChange={setNewTitle}
                            size="sm"
                        />
                        <Input
                            label="Lien de redirection (Optionnel)"
                            placeholder="Ex: /collections/hiver"
                            value={newLink}
                            onValueChange={setNewLink}
                            startContent={<ExternalLink size={14} className="text-gray-400" />}
                            size="sm"
                        />
                        <div className="pt-2">
                            <Button
                                color="primary"
                                fullWidth
                                isLoading={isUploading}
                                isDisabled={!newImage || isUploading}
                                onClick={handleAddSlide}
                            >
                                Ajouter au carrousel
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Liste des slides existants */}
            <div className="space-y-4">
                <h2 className="font-semibold text-lg">Vos Slides Actuels ({slides?.length || 0})</h2>
                {slides && slides.length > 0 ? (
                    <div className="grid gap-4">
                        {slides.map((slide, index) => (
                            <Card key={slide.id} className="p-3 flex flex-row items-center gap-4">
                                {/* Drag Handle (Visual only effectively unless using proper DnD lib) / Ordering Buttons */}
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => handleMove(slide, -1)}
                                        disabled={index === 0}
                                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                    >▲</button>
                                    <button
                                        onClick={() => handleMove(slide, 1)}
                                        disabled={index === slides.length - 1}
                                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                    >▼</button>
                                </div>

                                {/* Image */}
                                <div className="w-32 h-20 relative rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    <Image src={slide.imageURL} alt={slide.title} classNames={{ img: "object-cover w-full h-full" }} />
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    {slide.title && <h3 className="font-semibold">{slide.title}</h3>}
                                    {slide.link && (
                                        <p className="text-xs text-blue-600 flex items-center gap-1">
                                            <ExternalLink size={10} /> {slide.link}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        Créé le {slide.timestampCreate?.toDate().toLocaleDateString() ?? "N/A"}
                                    </p>
                                </div>

                                {/* Actions */}
                                <Button isIconOnly color="danger" variant="light" onClick={() => handleDelete(slide.id)}>
                                    <Trash2 size={18} />
                                </Button>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic text-center py-8">Aucun slide configuré. Ajoutez-en un au-dessus !</p>
                )}
            </div>
        </div>
    );
}
