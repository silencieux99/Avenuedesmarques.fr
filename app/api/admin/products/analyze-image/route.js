import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialize to prevent build errors
const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
    }
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
};

export async function POST(request) {
    try {
        const openai = getOpenAIClient();
        // Construire le prompt pour une analyse experte et SEO
        const promptText = `Tu es un expert mondial en mode, luxe et prêt-à-porter, spécialisé dans l'identification précise de vêtements de marque et l'optimisation SEO pour le e-commerce.

MISSION :
Analyser cette image avec une précision extrême pour identifier la marque, le modèle exacte et les caractéristiques du produit.

1. IDENTIFICATION MARQUE & MODÈLE :
- Identifie la marque EXACTE (ex: Gucci, Zara, Louis Vuitton, Nike, etc.) en analysant les logos, motifs (monogrammes), coupes et détails signatures.
- Identifie le modèle précis ou le nom de la collection si possible.

2. DESCRIPTION & SEO :
- Rédige un titre optimisé SEO (Marque + Type + Modèle + Caractéristique clé).
- Rédige une description vendeuse, riche en mots-clés pertinents (matière, coupe, occasion, style), qui donne envie d'acheter.

FORMAT DE RÉPONSE JSON STRICT :
{
  "titre": "Titre SEO optimisé (ex: Sac Gucci Marmont en Cuir Matelassé Noir)",
  "description": "Description commerciale détaillée (environ 150-200 mots). Mentionne le style, la matière (soie, coton, cuir...), la coupe, les détails (boutons dorés, broderies...), et comment le porter. Ton professionnel et haut de gamme.",
  "categorie": "Catégorie principale (Sacs, Vêtements, Chaussures, Accessoires)",
  "sousCategorie": "Type précis (Robe de soirée, Baskets montantes, Sac bandoulière)",
  "couleur": "Couleur principale précise (ex: Bleu Marine, Bordeaux, Écru)",
  "matiere": "Matière principale identifiée ou supposée avec haute probabilité",
  "etat": "Neuf avec étiquette",
  "tags": ["marque", "type", "couleur", "matière", "style", "tendance", "mots-clés SEO"]
}

Réponds UNIQUEMENT avec le JSON validé, sans aucun texte avant ou après.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: promptText
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1500,
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('Pas de réponse de l\'IA');
        }

        // Nettoyer la réponse (enlever les balises markdown si présentes)
        let cleanedContent = content.trim();
        if (cleanedContent.startsWith('```json')) {
            cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedContent.startsWith('```')) {
            cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Parse le JSON de la réponse
        const productData = JSON.parse(cleanedContent.trim());

        return NextResponse.json(productData);
    } catch (error) {
        console.error('Erreur lors de l\'analyse de l\'image:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur lors de l\'analyse' },
            { status: 500 }
        );
    }
}
