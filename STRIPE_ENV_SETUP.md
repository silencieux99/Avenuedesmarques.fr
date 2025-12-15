# ⚡ Configuration Stripe - Variables d'environnement

## 📝 Instructions

Copiez et collez ces lignes dans votre fichier `.env.local` à la racine du projet.

Si le fichier n'existe pas, créez-le avec la commande :

```bash
# Windows PowerShell
New-Item -Path .env.local -ItemType File

# Ou créez-le manuellement dans VS Code
```

## 🔑 Variables à ajouter

Ajoutez ces lignes à la fin de votre fichier `.env.local` :

```env
# ============================================
# STRIPE CONFIGURATION
# ============================================

# Clé publique Stripe (visible côté client)
# Récupérer sur : https://dashboard.stripe.com/test/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_ICI

# Clé secrète Stripe (JAMAIS exposée côté client)
# Récupérer sur : https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI

# Secret du webhook Stripe
# En local : Lancer `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
# En production : Récupérer sur https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK_ICI
```

## 🌐 URL du domaine

Vérifiez aussi que cette variable existe (devrait déjà être présente) :

```env
# URL de votre site (localhost en dev, votre domaine en prod)
NEXT_PUBLIC_DOMAIN=http://localhost:3000
```

## ✅ Checklist de configuration

### En mode TEST (développement)

1. ✅ Aller sur [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. ✅ Créer un compte Stripe
3. ✅ Aller dans **Développeurs** → **Clés API**
4. ✅ S'assurer d'être en mode **Test** (toggle en haut à droite)
5. ✅ Copier la **Clé publiable** (commence par `pk_test_`)
6. ✅ Copier la **Clé secrète** (commence par `sk_test_`)
7. ✅ Installer Stripe CLI : [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
8. ✅ Lancer la commande :
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
9. ✅ Copier le webhook secret affiché (commence par `whsec_`)
10. ✅ Redémarrer le serveur Next.js :
    ```bash
    npm run dev
    ```

### En mode PRODUCTION (site en ligne)

1. ✅ Activer votre compte Stripe (vérification d'identité)
2. ✅ Basculer en mode **Production** dans le dashboard
3. ✅ Récupérer les clés de production (`pk_live_` et `sk_live_`)
4. ✅ Configurer le webhook sur Stripe Dashboard :
   - URL : `https://votre-domaine.com/api/webhooks/stripe`
   - Événements : `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
5. ✅ Copier le secret du webhook de production
6. ✅ Ajouter les variables dans Vercel :
   - Settings → Environment Variables
   - Ajouter les 3 variables Stripe

## 🧪 Tester la configuration

Une fois les variables ajoutées :

```bash
# 1. Redémarrer le serveur
npm run dev

# 2. Dans un autre terminal, lancer le webhook local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3. Tester un paiement avec la carte de test
# Numéro : 4242 4242 4242 4242
# Date : 12/25
# CVC : 123
```

## ⚠️ Important

- ❌ Ne JAMAIS committer le fichier `.env.local` (il est dans `.gitignore`)
- ❌ Ne JAMAIS partager vos clés secrètes
- ✅ Utiliser les clés de TEST en développement
- ✅ Utiliser les clés de PRODUCTION uniquement sur le site en ligne

## 🆘 En cas de problème

Si vous voyez des erreurs :
- Vérifiez que les variables sont bien nommées (respectez la casse)
- Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
- Redémarrez le serveur Next.js après modification
- Vérifiez que Stripe CLI est bien lancé pour le webhook local

---

**Une fois configuré, tout fonctionnera automatiquement !** 🎉
