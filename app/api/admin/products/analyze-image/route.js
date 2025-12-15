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
        const { imageUrl, mode = 'luxe', mannequin = null } = await request.json();

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'URL de l\'image requise' },
                { status: 400 }
            );
        }

        // Définir les informations des mannequins
        const mannequinInfo = {
            assia: {
                nom: 'Assia',
                taille: '1.75m',
                mensurations: 'taille 38'
            },
            sonia: {
                nom: 'Sonia',
                taille: '1.70m',
                mensurations: 'taille 42'
            }
        };

        // Construire le prompt selon le mode
        let promptText = '';

        if (mode === 'luxe') {
            promptText = `Tu es un expert en produits de luxe et de mode. Analyse cette image avec une attention particulière aux logos, motifs et détails de marque.

IMPORTANT: Identifie la marque exacte en cherchant:
- Les logos visibles (LV, Gucci, Hermès, Chanel, Dior, etc.)
- Les motifs signature (monogramme LV, GG de Gucci, etc.)
- Les détails caractéristiques de chaque marque

Fournis les informations au format JSON strict:
{
  "titre": "Marque + Type de produit (ex: Louis Vuitton Sac Speedy)",
  "description": "Description détaillée incluant les matériaux, dimensions approximatives, caractéristiques distinctives, motifs, et état visible",
  "categorie": "Catégorie principale (Sacs à main, Vêtements, Chaussures, Accessoires, Bijoux, Montres)",
  "sousCategorie": "MARQUE EXACTE (Louis Vuitton, Gucci, Hermès, Chanel, Dior, Prada, Fendi, Balenciaga, etc.)",
  "couleur": "Couleur(s) principale(s)",
  "matiere": "Matière principale (Cuir, Toile, Synthétique, etc.)",
  "etat": "État visible (Neuf avec étiquette, Excellent état, Très bon état, Bon état, État correct)",
  "tags": ["marque", "type", "couleur", "style", "caractéristique1", "caractéristique2"]
}

Réponds UNIQUEMENT avec le JSON, sans balises markdown ni texte supplémentaire.`;
        } else {
            // Mode vêtement
            const mannequinData = mannequin && mannequinInfo[mannequin] ? mannequinInfo[mannequin] : null;
            const mannequinText = mannequinData
                ? `\n\nINFORMATIONS MANNEQUIN:
Le mannequin ${mannequinData.nom} mesure ${mannequinData.taille} et porte du ${mannequinData.mensurations}.
Inclus ces informations dans la description pour aider les clientes à se projeter.`
                : '';

            promptText = `Tu es un expert en mode féminine et vêtements modestes. Analyse cette image de vêtement porté par un mannequin.

Ta mission:
- Identifier le type de vêtement (Robe, Abaya, Kimono, Ensemble, Tunique, etc.)
- Décrire le style, la coupe, les détails (broderies, boutons, ceinture, etc.)
- Identifier les couleurs et motifs
- Décrire la matière apparente (Coton, Lin, Satin, Mousseline, etc.)
- Créer un titre attractif et une description détaillée${mannequinText}

Fournis les informations au format JSON strict:
{
  "titre": "Titre accrocheur du vêtement (ex: Robe Longue Élégante à Manches Bouffantes)",
  "description": "Description détaillée et attractive incluant: le style, la coupe, les détails (manches, col, fermeture), les occasions d'usage, le confort, et les informations du mannequin si fournies. Rédige de manière à donner envie d'acheter.",
  "categorie": "Catégorie principale (Robes, Abayas, Ensembles, Kimonos, Tuniques, Jupes, Pantalons)",
  "sousCategorie": "Sous-catégorie ou style (Robe longue, Abaya moderne, Ensemble chic, Kimono léger, etc.)",
  "couleur": "Couleur(s) principale(s) et secondaire(s)",
  "matiere": "Matière apparente (Coton, Lin, Polyester, Satin, Mousseline, Crêpe, etc.)",
  "etat": "Neuf avec étiquette",
  "tags": ["type", "style", "couleur", "occasion", "caractéristique1", "caractéristique2", "modeste", "élégant"]
}

Réponds UNIQUEMENT avec le JSON, sans balises markdown ni texte supplémentaire.`;
        }

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
