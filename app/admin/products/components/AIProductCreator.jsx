"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Loader, Check, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCategories } from "@/lib/firestore/categories/read";
import { useBrands } from "@/lib/firestore/brands/read";
import { createProductFromAI } from "@/lib/firestore/products/write";
import toast from "react-hot-toast";

export default function AIProductCreator() {
    const router = useRouter();
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
    const [analyzing, setAnalyzing] = useState(false);
    const [creating, setCreating] = useState(false);
    const [analyzedData, setAnalyzedData] = useState(null);

    // Form fields matching Avenuedesmarques schema
    const [price, setPrice] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [stock, setStock] = useState("1");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState("");
    const [shortDescription, setShortDescription] = useState("");

    const { data: categories } = useCategories();
    const { data: brands } = useBrands();

    const [mode, setMode] = useState('vetement');
    const [mannequin, setMannequin] = useState('assia');

    // Reset analysis when mode changes
    useEffect(() => {
        if (analyzedData) {
            setAnalyzedData(null);
        }
    }, [mode, mannequin]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setImages(prev => [...prev, ...files]);
            setAnalyzedData(null);

            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));

        if (index === primaryImageIndex) {
            setPrimaryImageIndex(0);
        } else if (index < primaryImageIndex) {
            setPrimaryImageIndex(prev => prev - 1);
        }
    };

    const handleAnalyze = async () => {
        if (images.length === 0) return;

        setAnalyzing(true);

        try {
            // 1. Upload images first
            const uploadedUrls = [];

            for (const img of images) {
                // Upload logic matching standard Next.js / API upload
                // We use the existing API upload route if possible or a custom logic
                const formData = new FormData();
                formData.append("file", img); // Assuming api/upload expects 'file'

                // Check how write.jsx was doing it: fetch(`/api/upload?filename=${file.name}`, body: file)
                // Adjusting to match existing upload pattern in write.jsx

                const response = await fetch(`/api/upload?filename=${img.name}`, {
                    method: 'POST',
                    body: img,
                });

                if (!response.ok) throw new Error("Erreur lors de l'upload");
                const data = await response.json();
                uploadedUrls.push(data.url);
            }

            setUploadedImageUrls(uploadedUrls);

            // 2. Analyze
            const analyzeResponse = await fetch("/api/admin/products/analyze-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: uploadedUrls[0],
                    mode: mode,
                    mannequin: mode === 'vetement' ? mannequin : null
                }),
            });

            if (!analyzeResponse.ok) throw new Error("Erreur lors de l'analyse");
            const analyzed = await analyzeResponse.json();
            setAnalyzedData(analyzed);

            // Pre-fill fields
            setShortDescription(analyzed.description.substring(0, 150) + "...");

        } catch (err) {
            toast.error(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handlePublish = async () => {
        if (!analyzedData || uploadedImageUrls.length === 0 || !price || !selectedCategoryId) return;

        setCreating(true);

        try {
            const numPrice = parseFloat(price);
            const numSalePrice = salePrice ? parseFloat(salePrice) : numPrice;

            // Prepare data for Avenuedesmarques schema
            const productData = {
                title: analyzedData.titre,
                slug: analyzedData.titre.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
                shortDescription: shortDescription,
                description: analyzedData.description, // HTML/Rich text usually, but string works
                brandId: selectedBrandId,
                categoryId: selectedCategoryId,
                stock: parseInt(stock) || 1,
                price: numPrice,
                salePrice: numSalePrice,
                isFeatured: false,
                // Add extra fields as needed if schema supports them, or append to description
            };

            // Determine feature image vs list
            const featureImageUrl = uploadedImageUrls[primaryImageIndex];
            const otherImages = uploadedImageUrls.filter((_, i) => i !== primaryImageIndex);

            await createProductFromAI({
                data: productData,
                featureImageURL: featureImageUrl,
                imageListURLs: otherImages
            });

            toast.success("Produit créé avec succès !");
            setTimeout(() => {
                router.push("/admin/products");
            }, 1500);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-600 rounded-xl">
                        <Sparkles size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Création IA de Produit</h2>
                        <p className="text-gray-600">Uploadez une image et l'IA fera le reste</p>
                    </div>
                </div>

                {/* Mode Selection */}
                <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Type de produit</label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setMode('vetement')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${mode === 'vetement'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            👗 Vêtement
                        </button>
                        <button
                            onClick={() => setMode('luxe')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${mode === 'luxe'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            💎 Luxe
                        </button>
                    </div>
                </div>

                {/* Mannequin Selection (only for vetement mode) */}
                {mode === 'vetement' && (
                    <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Mannequin</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setMannequin('assia')}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${mannequin === 'assia'
                                        ? 'bg-pink-500 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="font-bold">Assia</div>
                                    <div className="text-xs mt-1 opacity-90">1.75m • Taille 38</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setMannequin('sonia')}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${mannequin === 'sonia'
                                        ? 'bg-pink-500 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="font-bold">Sonia</div>
                                    <div className="text-xs mt-1 opacity-90">1.70m • Taille 42</div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload Zone */}
                {imagePreviews.length === 0 ? (
                    <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center bg-white">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                            id="ai-image-upload"
                        />
                        <label htmlFor="ai-image-upload" className="cursor-pointer">
                            <Upload size={48} className="mx-auto text-purple-400 mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                Cliquez pour uploader des images
                            </p>
                            <p className="text-sm text-gray-500">PNG, JPG, GIF jusqu'à 10MB (plusieurs images possibles)</p>
                        </label>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Images Preview */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-3">
                                💡 Cliquez sur une image pour la définir comme principale
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <div
                                            onClick={() => setPrimaryImageIndex(index)}
                                            className={`relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 cursor-pointer transition-all ${index === primaryImageIndex
                                                    ? 'ring-4 ring-blue-500 shadow-lg'
                                                    : 'hover:ring-2 hover:ring-blue-300'
                                                }`}
                                        >
                                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                            {index === primaryImageIndex && (
                                                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                                                    <Check size={12} />
                                                    Principale
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage(index);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}

                                {/* Add More Button */}
                                <label htmlFor="ai-image-upload-more" className="cursor-pointer">
                                    <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-purple-400 transition-colors">
                                        <Plus size={32} className="text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500">Ajouter</p>
                                    </div>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="ai-image-upload-more"
                                />
                            </div>
                        </div>

                        {/* Analyze Button */}
                        {!analyzedData && (
                            <div className="space-y-3">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="w-full bg-purple-600 text-white py-4 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader size={20} className="animate-spin" />
                                            Analyse en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={20} />
                                            Analyser avec l'IA
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Analyzed Data */}
                        <AnimatePresence>
                            {analyzedData && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-xl p-6 border border-gray-200 space-y-4"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Check size={20} className="text-green-600" />
                                        <h3 className="text-lg font-semibold">Analyse terminée</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Titre</label>
                                            <p className="text-gray-900 font-medium">{analyzedData.titre}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Catégorie suggérée</label>
                                            <p className="text-gray-900 font-medium">
                                                {analyzedData.categorie} → {analyzedData.sousCategorie}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-gray-600">Description</label>
                                        <p className="text-gray-900 mt-1">{analyzedData.description}</p>
                                    </div>

                                    {/* Category Selection */}
                                    <div className="pt-4 border-t space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Catégorie *
                                            </label>
                                            <select
                                                value={selectedCategoryId}
                                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                            >
                                                <option value="">Sélectionnez une catégorie</option>
                                                {categories?.map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Marque *
                                            </label>
                                            <select
                                                value={selectedBrandId}
                                                onChange={(e) => setSelectedBrandId(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                            >
                                                <option value="">Sélectionnez une marque</option>
                                                {brands?.map(brand => (
                                                    <option key={brand.id} value={brand.id}>
                                                        {brand.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Courte Description *
                                            </label>
                                            <input
                                                type="text"
                                                value={shortDescription}
                                                onChange={(e) => setShortDescription(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Prix (€) *
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={price}
                                                    onChange={(e) => setPrice(e.target.value)}
                                                    placeholder="99.99"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Prix Soldé (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={salePrice}
                                                    onChange={(e) => setSalePrice(e.target.value)}
                                                    placeholder="Optional"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Stock *
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={stock}
                                                onChange={(e) => setStock(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Publish Button */}
                                    <button
                                        onClick={handlePublish}
                                        disabled={creating || !price || !selectedCategoryId || !selectedBrandId}
                                        className="w-full bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {creating ? (
                                            <>
                                                <Loader size={20} className="animate-spin" />
                                                Création en cours...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={20} />
                                                Publier le produit
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
