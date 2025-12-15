# Guide de Migration: Amirat Modestie → Avenue des Marques

Ce guide vous explique comment migrer les catégories et produits d'Amirat Modestie vers Avenue des Marques.

## Méthode Recommandée: Export/Import via Firebase Console

### Étape 1: Exporter les données d'Amirat Modestie

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez le projet **Amirat Modestie**
3. Allez dans **Firestore Database**
4. Cliquez sur les 3 points (⋮) en haut à droite
5. Sélectionnez **"Export data"**
6. Choisissez les collections à exporter:
   - `categories`
   - `products`
   - `brands` (si existe)
7. Notez le bucket GCS où les données sont exportées

### Étape 2: Importer dans Avenue des Marques

1. Allez sur le projet **Avenue des Marques** dans Firebase Console
2. Allez dans **Firestore Database**
3. Cliquez sur les 3 points (⋮) → **"Import data"**
4. Sélectionnez le bucket GCS avec l'export d'Amirat
5. Importez les collections

### Étape 3: Adapter la structure des données

Les produits d'Amirat ont une structure différente. Utilisez le script de migration fourni pour adapter:

```bash
cd c:\Users\Administrator\Desktop\sites\Avenuedesmarques.fr
node scripts\migrate-from-amirat.js
```

## Méthode Alternative: Script de Migration Direct

Si vous avez accès aux credentials Firebase des deux projets:

### 1. Obtenir les credentials Amirat Modestie

Créez un fichier `amirat-credentials.json` avec les credentials du service account:

```json
{
  "type": "service_account",
  "project_id": "amirat-xxxxx",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  ...
}
```

### 2. Modifier le script de migration

Éditez `scripts/migrate-from-amirat.js` et ajoutez les credentials:

```javascript
const sourceServiceAccount = require('../amirat-credentials.json');
```

### 3. Exécuter la migration

```bash
node scripts/migrate-from-amirat.js
```

## Structure des Données

### Amirat Modestie → Avenue des Marques

**Catégories:**
- `nom` → `name`
- `categoryIds` (array) → `categoryId` (single)
- Hiérarchie préservée via `parentId`

**Produits:**
- `name` → `title`
- `description` → `shortDescription` (tronqué à 200 chars)
- `price` → `price`
- `prixBarre` → `salePrice`
- `quantity` → `stock`
- `images[0]` → `featureImageURL`
- `images[1+]` → `imageList`
- `categoryIds[0]` → `categoryId`
- `brand` (string) → `brandId` (référence)

## Vérifications Post-Migration

Après la migration, vérifiez:

1. ✅ Toutes les catégories sont présentes
2. ✅ La hiérarchie parent/enfant est correcte
3. ✅ Les produits ont des images
4. ✅ Les prix sont corrects
5. ✅ Les catégories sont bien liées
6. ✅ Les marques sont créées et liées

## Nettoyage

Si la migration échoue ou si vous voulez recommencer:

```javascript
// Dans Firebase Console, supprimez les collections:
// - categories
// - products
// - brands

// Puis relancez la migration
```

## Support

En cas de problème, vérifiez:
- Les credentials Firebase sont valides
- Les deux projets sont accessibles
- Les collections existent dans Amirat
- Les quotas Firestore ne sont pas dépassés
