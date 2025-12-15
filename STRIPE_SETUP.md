# Configuration Stripe - Avenue des Marques

## 📋 Étapes de configuration

### 1. Créer un compte Stripe

1. Allez sur [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Créez votre compte Stripe
3. Complétez les informations de votre entreprise

### 2. Récupérer les clés API

#### En mode Test (pour développement)
1. Dans le Dashboard Stripe, cliquez sur **Développeurs** → **Clés API**
2. Vous verrez deux clés en mode **Test** :
   - **Clé publiable** (commence par `pk_test_...`)
   - **Clé secrète** (commence par `sk_test_...`)

#### En mode Production (pour le site en ligne)
1. Activez votre compte Stripe (vérification d'identité requise)
2. Basculez en mode **Production** (toggle en haut à droite)
3. Récupérez les clés de production :
   - **Clé publiable** (commence par `pk_live_...`)
   - **Clé secrète** (commence par `sk_live_...`)

### 3. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook
```

⚠️ **Important** : 
- La clé publique commence par `NEXT_PUBLIC_` car elle est utilisée côté client
- La clé secrète et le webhook secret ne doivent JAMAIS être exposés côté client

### 4. Configurer le Webhook

#### En local (développement)

1. **Installer Stripe CLI** :
   ```bash
   # Windows (avec Scoop)
   scoop install stripe
   
   # Ou télécharger depuis https://stripe.com/docs/stripe-cli
   ```

2. **Se connecter à Stripe** :
   ```bash
   stripe login
   ```

3. **Lancer le webhook en local** :
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copier le webhook secret** affiché (commence par `whsec_...`) et l'ajouter dans `.env.local`

#### En production (Vercel)

1. Dans le Dashboard Stripe, allez dans **Développeurs** → **Webhooks**
2. Cliquez sur **Ajouter un endpoint**
3. Entrez l'URL de votre webhook :
   ```
   https://votre-domaine.com/api/webhooks/stripe
   ```

4. Sélectionnez les événements à écouter :
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

5. Cliquez sur **Ajouter un endpoint**
6. Copiez le **Secret de signature** (commence par `whsec_...`)
7. Ajoutez-le dans les variables d'environnement Vercel :
   - Allez dans **Settings** → **Environment Variables**
   - Ajoutez `STRIPE_WEBHOOK_SECRET` avec la valeur copiée

### 5. Configurer les paramètres Stripe

#### Paramètres de paiement recommandés

1. **Devises** : EUR (Euro)
2. **Méthodes de paiement** :
   - ✅ Cartes (Visa, Mastercard, Amex)
   - ✅ Apple Pay
   - ✅ Google Pay
   - ⚠️ Bancontact, iDEAL (optionnel, pour Belgique/Pays-Bas)

3. **Emails** :
   - ✅ Activer les reçus automatiques
   - ✅ Personnaliser avec votre logo

4. **Branding** :
   - Allez dans **Paramètres** → **Branding**
   - Ajoutez votre logo
   - Personnalisez les couleurs

### 6. Tester le paiement

#### Cartes de test Stripe

En mode test, utilisez ces numéros de carte :

| Carte | Numéro | Résultat |
|-------|--------|----------|
| Visa réussie | `4242 4242 4242 4242` | ✅ Paiement réussi |
| Visa refusée | `4000 0000 0000 0002` | ❌ Paiement refusé |
| 3D Secure | `4000 0027 6000 3184` | 🔐 Authentification requise |

**Autres informations de test** :
- Date d'expiration : N'importe quelle date future (ex: 12/25)
- CVC : N'importe quel 3 chiffres (ex: 123)
- Code postal : N'importe quel code (ex: 75001)

### 7. Vérifier que tout fonctionne

#### Checklist de test :

1. ✅ Ajouter un produit au panier
2. ✅ Aller au checkout
3. ✅ Remplir les informations de livraison
4. ✅ Cliquer sur "Payer"
5. ✅ Être redirigé vers Stripe
6. ✅ Entrer une carte de test
7. ✅ Être redirigé vers la page de succès
8. ✅ Vérifier que la commande apparaît dans l'admin
9. ✅ Vérifier que le panier est vidé
10. ✅ Vérifier que le stock est mis à jour

### 8. Passer en production

Quand vous êtes prêt à accepter de vrais paiements :

1. **Activer votre compte Stripe** :
   - Compléter les informations bancaires
   - Vérifier votre identité
   - Accepter les conditions

2. **Basculer les clés** :
   - Remplacer `pk_test_...` par `pk_live_...`
   - Remplacer `sk_test_...` par `sk_live_...`
   - Mettre à jour le webhook secret de production

3. **Configurer le webhook de production** (voir étape 4)

4. **Tester avec une vraie carte** (petit montant)

5. **Activer le site** 🚀

## 🔧 Dépannage

### Le webhook ne fonctionne pas

- Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien configuré
- Vérifiez les logs Stripe : **Développeurs** → **Webhooks** → **Logs**
- En local, vérifiez que `stripe listen` est en cours d'exécution

### Les paiements ne créent pas de commandes

- Vérifiez les logs du webhook dans Stripe
- Vérifiez les logs de votre application (Vercel logs)
- Vérifiez que Firebase Admin est bien configuré

### Erreur "No such checkout session"

- Vérifiez que la session est bien sauvegardée dans Firestore
- Vérifiez que le `checkoutId` est bien passé dans l'URL

## 📚 Documentation utile

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Documentation Stripe](https://stripe.com/docs)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)
- [Cartes de test](https://stripe.com/docs/testing)

## 🎯 Résumé rapide

```bash
# 1. Récupérer les clés Stripe
# 2. Ajouter dans .env.local :
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 3. Tester en local avec Stripe CLI :
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 4. Tester un paiement avec la carte : 4242 4242 4242 4242

# 5. Vérifier la commande dans l'admin

# 6. En production : configurer le webhook sur Stripe Dashboard
```

Tout est prêt ! 🎉
