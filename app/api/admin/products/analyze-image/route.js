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
        const { imageUrl, imageUrls, mode } = await request.json();

        if (!imageUrl && (!imageUrls || imageUrls.length === 0)) {
            return NextResponse.json(
                { error: 'URL de l\'image requise' },
                { status: 400 }
            );
        }

        // Construire le prompt pour une analyse experte et SEO
        let promptText = `Tu es un expert mondial en mode, luxe et prêt-à-porter, spécialisé dans l'identification précise de vêtements de marque et l'optimisation SEO pour le e-commerce.

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
  "sizes": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"], 
  "tags": ["marque", "type", "couleur", "matière", "style", "tendance", "mots-clés SEO"]
}

Réponds UNIQUEMENT avec le JSON validé, sans aucun texte avant ou après.`;

        if (mode === 'bulk') {
            promptText = `Tu es un expert mondial en mode et luxe.
            
MISSION :
Générer une description GÉNÉRIQUE et un titre GÉNÉRIQUE valables pour une collection de variantes de ce même modèle (différentes couleurs ou motifs similaires).
Je vais te fournir jusqu'à 3 images de ces variantes pour que tu comprennes ce qui est commun (la coupe, le modèle, la marque) et ce qui varie (la couleur).

RÈGLES CRITIQUES POUR LE MODE BULK :
1. NE MENTIONNE PAS LA COULEUR spécifique (ex: ne dis pas "rouge" ou "bleu", car cela dépend de la variante).
2. NE MENTIONNE PAS de motif spécifique unique s'il varie.
3. Le titre doit être suffisamment général : "T-shirt Gucci Coton Premium" au lieu de "T-shirt Gucci Rouge".
4. La description doit vendre le modèle et la qualité globale.

FORMAT DE RÉPONSE JSON STRICT :
{
  "titre": "Titre générique optimisé (Marque + Type + collection éventuelle)",
  "description": "Description générique qualitative (100-150 mots). Focalise-toi sur le confort, la marque, le prestige, la coupe. Ne parle pas de la couleur !",
  "categorie": "Catégorie principale",
  "sousCategorie": "Sous-catégorie",
  "sizes": ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]
}

Réponds UNIQUEMENT avec le JSON validé.`;
        }

        // Construct Content Message
        const messageContent = [
            {
                type: "text",
                text: promptText
            }
        ];

        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
            // Add up to 3 images as requested to save tokens but provide context
            imageUrls.slice(0, 3).forEach(url => {
                messageContent.push({
                    type: "image_url",
                    image_url: { url: url }
                });
            });
        } else if (imageUrl) {
            messageContent.push({
                type: "image_url",
                image_url: { url: imageUrl }
            });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: messageContent,
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
