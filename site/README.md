# Site de réservation Hair by SD

Site de réservation pour coiffeuse à domicile à Genève :

- **Réservation** : la cliente choisit une date, puis un horaire. Sous chaque horaire, elle voit les prestations possibles avec leur prix et leur acompte. Elle remplit ses coordonnées et l'adresse du rendez-vous, puis **paie l'acompte** (carte ou TWINT).
- **Boutique** : soins, extensions et cartes cadeaux, avec un panier, le choix de la livraison et le paiement en ligne.
- **Admin** (`/admin`) : rendez-vous à venir et passés, commandes, annulation d'un rendez-vous et blocage de jours (congés).

Les créneaux tiennent compte de la **durée de chaque prestation**, de **30 min de trajet** entre deux clientes, des horaires d'ouverture, d'un préavis de 24 h et des jours bloqués. Pendant le paiement, le créneau est mis de côté 30 min pour que deux clientes ne puissent pas le prendre en même temps.

## Modifier les prestations, prix, horaires et produits

Tout se trouve dans **`lib/config.ts`** : prestations (durée, prix, acompte), horaires de chaque jour, trajet, préavis, conditions d'annulation, produits et frais d'envoi.
Pour ajouter une photo à un produit, mets l'image dans `public/produits/` et indique `image: "/produits/nom.jpg"`.

## Mise en ligne (une seule fois)

1. **Stripe** (paiements) : crée un compte sur stripe.com avec ton activité en Suisse. Active **TWINT** (et Apple Pay / Google Pay) dans *Paramètres › Moyens de paiement* : le site propose automatiquement tous les moyens activés compatibles avec le CHF. Récupère la **clé secrète** (`sk_live_…`) dans *Développeurs › Clés API*.
2. **Base de données** : crée une base Postgres gratuite sur neon.tech et copie son URL de connexion (`postgresql://…`).
3. **Hébergement** : sur vercel.com, importe le dépôt GitHub et choisis `site` comme *Root Directory*. Renseigne ces variables d'environnement :
   - `SITE_URL` : l'adresse du site, par ex. `https://hairbysd.ch`
   - `ADMIN_PASSWORD` : ton mot de passe admin
   - `DATABASE_URL` : l'URL Neon
   - `STRIPE_SECRET_KEY` : la clé Stripe
4. **Webhook Stripe** : dans *Développeurs › Webhooks*, ajoute `https://TON-SITE/api/stripe/webhook` avec les événements `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded` et `checkout.session.async_payment_failed`. Copie le secret (`whsec_…`) dans `STRIPE_WEBHOOK_SECRET`, puis redéploie.
5. (Facultatif) Achète un nom de domaine (par ex. `hairbysd.ch`) et relie-le au site dans Vercel.

Sans `STRIPE_SECRET_KEY`, le site fonctionne en **mode démo** : le paiement est simulé et aucun argent n'est débité.

## Développement

```bash
npm install
cp .env.example .env.local   # puis remplis les valeurs
npm run dev                  # http://localhost:3000
npm test                     # tests du calcul des créneaux
npm run build
```

Sans `DATABASE_URL`, les données sont enregistrées dans `.data/db.json`. Ce mode est réservé au développement local.
