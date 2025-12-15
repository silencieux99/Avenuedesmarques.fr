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
    const [btnText, setBtnText] = useState("");

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
                    buttonText: btnText || "Découvrir",
                    rank: slides?.length || 0
                },
                imageFile: newImage
            });
            toast.success("Slide ajouté !");
            // Reset form
            setNewImage(null);
            setNewLink("");
            setNewTitle("");
            setBtnText("");
        } catch (error) {
            toast.error("Erreur : " + error.message);
        }
        setIsUploading(false);
    };

    const handleDelete = async (id) => {
        if (!id) return toast.error("ID invalide");
        if (confirm("Supprimer ce slide ?")) {
            try {
                await deleteHeroSlide(id);
                toast.success("Supprimé");
            } catch (e) {
                console.error(e);
                toast.error("Erreur suppression: " + e.message);
            }
        }
    };

    const handleMove = async (slide, direction) => {
        if (!slides) return;
        const index = slides.findIndex(s => s.id === slide.id);
        if (index === -1) return;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= slides.length) return;

        // Swap ranks logic simplified
        const newSlides = [...slides];
        [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];

        try {
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
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-2xl font-bold font-serif mb-2">Carrousel Page d'Accueil</h1>
                <p className="text-gray-500 text-sm">Gérez les bannières qui défilent en haut du site.</p>
            </div>

            {/* Formulaire d'ajout */}
            <Card className="p-4 border shadow-sm">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-blue-600" /> Ajouter une bannière
                </h2>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        {/* Image Preview / Input */}
                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center min-h-[160px] cursor-pointer overflow-hidden">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" // z-20 to be sure
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setNewImage(e.target.files[0]);
                                    }
                                }}
                            />

                            {newImage ? (
                                <div className="relative w-full h-full">
                                    <img src={URL.createObjectURL(newImage)} className="h-40 w-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                        Modifier l'image
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 p-4 pointer-events-none">
                                    <Upload className="mx-auto mb-2 w-8 h-8" />
                                    <span className="text-sm font-medium">Touchez ici pour choisir une image</span>
                                    <p className="text-xs mt-1 text-gray-300">JPG, PNG, WEBP</p>
                                </div>
                            )}
                        </div>
                        {/* Fallback button for mobile mostly */}
                        <div className="md:hidden">
                            <label className="block w-full">
                                <span className="sr-only">Choisir image</span>
                                <input type="file" accept="image/*"
                                    className="block w-full text-sm text-slate-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-violet-50 file:text-violet-700
                              hover:file:bg-violet-100
                            "
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setNewImage(e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        <Input
                            label="Titre Principal"
                            placeholder="Ex: Nouvelle Collection"
                            value={newTitle}
                            onValueChange={setNewTitle}
                            size="sm"
                            variant="bordered"
                        />
                        <div className="flex gap-2">
                            <Input
                                label="Texte Bouton"
                                placeholder="Ex: Découvrir"
                                value={btnText}
                                onValueChange={setBtnText}
                                size="sm"
                                variant="bordered"
                                className="flex-1"
                            />
                            <Input
                                label="Lien"
                                placeholder="/products"
                                value={newLink}
                                onValueChange={setNewLink}
                                startContent={<ExternalLink size={14} className="text-gray-400" />}
                                size="sm"
                                variant="bordered"
                                className="flex-1"
                            />
                        </div>

                        <Button
                            color="primary"
                            fullWidth
                            isLoading={isUploading}
                            isDisabled={!newImage || isUploading}
                            onClick={handleAddSlide}
                            className="mt-2 font-semibold"
                        >
                            {isUploading ? "Téléchargement..." : "Ajouter au carrousel"}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Liste des slides existants */}
            <div className="space-y-4">
                <h2 className="font-semibold text-lg border-b pb-2">Vos Slides Actuels</h2>
                {slides && slides.length > 0 ? (
                    <div className="grid gap-3">
                        {slides.map((slide, index) => (
                            <Card key={slide.id} className="p-3 flex flex-row items-center gap-3 md:gap-4 overflow-hidden">
                                {/* Ordering Buttons */}
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => handleMove(slide, -1)}
                                        disabled={index === 0}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded disabled:opacity-20 text-gray-600"
                                    >▲</button>
                                    <button
                                        onClick={() => handleMove(slide, 1)}
                                        disabled={index === slides.length - 1}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded disabled:opacity-20 text-gray-600"
                                    >▼</button>
                                </div>

                                {/* Image */}
                                <div className="w-24 h-16 md:w-32 md:h-20 relative rounded-lg overflow-hidden bg-gray-100 shrink-0 border">
                                    <Image
                                        src={slide.imageURL}
                                        alt={slide.title}
                                        classNames={{ img: "object-cover w-full h-full" }}
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm truncate">{slide.title || "Sans titre"}</h3>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {slide.link && (
                                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1 truncate max-w-[150px]">
                                                <ExternalLink size={8} /> {slide.link}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                            Bouton: {slide.buttonText || "Default"}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <Button
                                    isIconOnly
                                    color="danger"
                                    variant="flat"
                                    size="sm"
                                    onPress={() => handleDelete(slide.id)} // onPress handles touch better in NextUI
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed text-gray-400">
                        <p>Aucune bannière active.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
