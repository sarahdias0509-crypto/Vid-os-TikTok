// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION DE TON ACTIVITÉ
//  C'est le seul fichier à modifier pour changer prestations, prix, acomptes,
//  horaires et produits. Tous les montants sont en CHF.
//  ⚠️ Les prix ci-dessous sont des EXEMPLES : remplace-les par tes vrais tarifs.
// ─────────────────────────────────────────────────────────────────────────────

export const business = {
  name: "Hair by SD",
  instagram: "hairbysd",
  tagline: "Extensions, lissages & soins — à domicile à Genève",
  city: "Genève",
  area: "Genève et environs",
  timezone: "Europe/Zurich",
  currency: "chf",
};

export type ServiceCategory = "extensions" | "lissages" | "soins";

export type Service = {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  durationMin: number; // durée réelle de la prestation
  price: number; // prix total en CHF
  priceFrom?: boolean; // true = affiché « dès … CHF » (ex. selon la longueur)
  deposit: number; // acompte payé en ligne à la réservation (déduit du prix)
};

export const categoryLabels: Record<ServiceCategory, string> = {
  extensions: "Extensions",
  lissages: "Lissages",
  soins: "Soins",
};

export const services: Service[] = [
  {
    id: "weft-pose",
    category: "extensions",
    name: "Pose extensions Weft",
    description: "Tissage de bandes cousues sur rangs d'anneaux, rendu naturel et plat. Cheveux inclus selon la longueur.",
    durationMin: 180,
    price: 450,
    priceFrom: true,
    deposit: 100,
  },
  {
    id: "weft-remontee",
    category: "extensions",
    name: "Remontée Weft",
    description: "Entretien de tes Weft toutes les 6 à 8 semaines : on remonte les rangs au plus près de la racine.",
    durationMin: 120,
    price: 180,
    deposit: 50,
  },
  {
    id: "adhesives-pose",
    category: "extensions",
    name: "Pose bandes adhésives",
    description: "Extensions tape-in ultra fines, invisibles et légères. Cheveux inclus selon la longueur.",
    durationMin: 120,
    price: 350,
    priceFrom: true,
    deposit: 80,
  },
  {
    id: "adhesives-remontee",
    category: "extensions",
    name: "Remontée bandes adhésives",
    description: "Dépose, nettoyage et repose de tes bandes avec adhésif neuf.",
    durationMin: 90,
    price: 150,
    deposit: 40,
  },
  {
    id: "depose",
    category: "extensions",
    name: "Dépose d'extensions",
    description: "Retrait en douceur de tes extensions (Weft ou adhésives), sans abîmer tes cheveux.",
    durationMin: 45,
    price: 60,
    deposit: 20,
  },
  {
    id: "lissage-bresilien",
    category: "lissages",
    name: "Lissage brésilien",
    description: "Cheveux lisses, brillants et disciplinés jusqu'à 4-5 mois.",
    durationMin: 180,
    price: 250,
    priceFrom: true,
    deposit: 60,
  },
  {
    id: "lissage-tanin",
    category: "lissages",
    name: "Lissage au tanin",
    description: "Lissage sans formol, idéal pour cheveux sensibilisés.",
    durationMin: 180,
    price: 230,
    priceFrom: true,
    deposit: 60,
  },
  {
    id: "botox",
    category: "soins",
    name: "Soin botox capillaire",
    description: "Soin profond réparateur (sans injection) : brillance, douceur et cheveux repulpés.",
    durationMin: 90,
    price: 120,
    deposit: 30,
  },
];

// ── Horaires ────────────────────────────────────────────────────────────────
// 0 = dimanche, 1 = lundi … 6 = samedi. null = jour fermé. Heures au format "HH:MM".
export const openingHours: Record<number, { start: string; end: string } | null> = {
  0: null,
  1: { start: "09:00", end: "18:00" },
  2: { start: "09:00", end: "18:00" },
  3: { start: "09:00", end: "18:00" },
  4: { start: "09:00", end: "18:00" },
  5: { start: "09:00", end: "18:00" },
  6: { start: "09:00", end: "16:00" },
};

export const booking = {
  slotStepMin: 30, // un créneau toutes les 30 min
  travelBufferMin: 30, // temps de trajet entre deux clientes (à domicile)
  minNoticeHours: 24, // réservation au plus tard 24 h avant
  maxDaysAhead: 60, // calendrier ouvert sur 60 jours
  holdMinutes: 30, // un créneau est bloqué 30 min le temps du paiement
  cancellationPolicy:
    "L'acompte est déduit du prix de ta prestation. Il est remboursable si tu annules au moins 48 h à l'avance (par DM Instagram) ; au-delà, il est conservé.",
};

// ── Boutique ────────────────────────────────────────────────────────────────
export type ProductCategory = "soins" | "extensions" | "cartes-cadeaux";

export type Product = {
  id: string;
  category: ProductCategory;
  name: string;
  description: string;
  price: number;
  image?: string; // chemin dans /public, ex. "/produits/masque.jpg" (optionnel)
  digital?: boolean; // true = pas d'envoi (carte cadeau)
  available?: boolean; // false = affiché « épuisé »
};

export const productCategoryLabels: Record<ProductCategory, string> = {
  soins: "Soins & entretien",
  extensions: "Extensions & mèches",
  "cartes-cadeaux": "Cartes cadeaux",
};

export const products: Product[] = [
  {
    id: "shampoing-doux",
    category: "soins",
    name: "Shampoing doux sans sulfate",
    description: "Spécial extensions et cheveux lissés : nettoie sans dessécher ni décoller les bandes.",
    price: 28,
  },
  {
    id: "masque-reparateur",
    category: "soins",
    name: "Masque réparateur",
    description: "Nourrit les longueurs et prolonge la tenue de ton lissage.",
    price: 34,
  },
  {
    id: "serum-pointes",
    category: "soins",
    name: "Sérum pointes",
    description: "Anti-frisottis et brillance, sans alourdir.",
    price: 29,
  },
  {
    id: "brosse-extensions",
    category: "extensions",
    name: "Brosse spéciale extensions",
    description: "Picots souples qui démêlent sans tirer sur les attaches.",
    price: 25,
  },
  {
    id: "bandes-recharge",
    category: "extensions",
    name: "Recharge adhésifs (lot de 20)",
    description: "Adhésifs de remplacement pour bandes tape-in.",
    price: 15,
  },
  {
    id: "carte-50",
    category: "cartes-cadeaux",
    name: "Carte cadeau 50 CHF",
    description: "À offrir pour un soin ou un produit. Envoyée par e-mail.",
    price: 50,
    digital: true,
  },
  {
    id: "carte-100",
    category: "cartes-cadeaux",
    name: "Carte cadeau 100 CHF",
    description: "À offrir pour un soin, un lissage ou des extensions. Envoyée par e-mail.",
    price: 100,
    digital: true,
  },
  {
    id: "carte-200",
    category: "cartes-cadeaux",
    name: "Carte cadeau 200 CHF",
    description: "Le cadeau parfait pour des extensions. Envoyée par e-mail.",
    price: 200,
    digital: true,
  },
];

export const shipping = {
  options: [
    { id: "rdv", label: "Remise en main propre lors d'un rendez-vous", price: 0 },
    { id: "poste", label: "Envoi par La Poste (Suisse)", price: 9 },
  ],
};
