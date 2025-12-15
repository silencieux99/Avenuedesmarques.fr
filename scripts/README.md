# Scripts de Migration

Ce dossier contient les scripts pour migrer les données d'Amirat Modestie vers Avenue des Marques.

## Fichiers

- `migrate-simple.js` - Script de migration utilisant Firebase Client SDK (recommandé)
- `migrate-from-amirat.js` - Script de migration utilisant Firebase Admin SDK
- `../MIGRATION_GUIDE.md` - Guide complet de migration

## Utilisation Rapide

### 1. Prérequis

```bash
npm install firebase dotenv
```

### 2. Configuration

Éditez `migrate-simple.js` et remplacez les credentials Amirat Modestie:

```javascript
const amiratConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "amirat-modestie.firebaseapp.com",
  projectId: "amirat-modestie",
  // ... autres configs
};
```

### 3. Exécution

```bash
node scripts/migrate-simple.js
```

## Ce que fait le script

1. ✅ Migre toutes les catégories (avec hiérarchie parent/enfant)
2. ✅ Migre toutes les marques
3. ✅ Migre tous les produits publiés
4. ✅ Adapte la structure des données
5. ✅ Crée les slugs automatiquement
6. ✅ Préserve les images et les prix

## Mapping des Données

| Amirat | Avenue |
|--------|--------|
| `nom` | `name` |
| `categoryIds[]` | `categoryId` |
| `images[0]` | `featureImageURL` |
| `images[1+]` | `imageList` |
| `prixBarre` | `salePrice` |
| `quantity` | `stock` |

## Sécurité

⚠️ **IMPORTANT**: Ne commitez JAMAIS les credentials Firebase dans Git!

Les fichiers suivants sont dans `.gitignore`:
- `.env.local`
- `amirat-credentials.json`
- `scripts/migrate-*.js` (si modifiés avec credentials)

## Dépannage

### Erreur: "Permission denied"
- Vérifiez que les credentials Firebase sont corrects
- Assurez-vous d'avoir les droits d'écriture sur Avenue des Marques

### Erreur: "Collection not found"
- Vérifiez que les collections existent dans Amirat
- Vérifiez les noms de collections (case-sensitive)

### Produits sans catégorie
- Le script assigne `null` si la catégorie n'existe pas
- Vous pouvez les réassigner manuellement après migration

## Support

Pour toute question, consultez `MIGRATION_GUIDE.md`
