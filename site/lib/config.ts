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

export type Variant = { id: string; label: string; price: number };

export type Service = {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  durationMin: number; // durée de la prestation (sert à calculer les créneaux)
  price: number; // prix en CHF (pour une prestation à options : le prix le plus bas, affiché « dès »)
  priceFrom?: boolean; // true = affiché « dès … CHF »
  deposit: number; // acompte payé en ligne à la réservation (déduit du prix)
  variants?: Variant[]; // options au choix (longueur, couleur…) avec leur prix
};

// ── Aides pour écrire les grilles de prix ───────────────────────────────────
const slug = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");

/** Prix selon la longueur des cheveux : [court, mi-long, long, extra-long]. */
function byLength(prices: [number, number, number, number]): Variant[] {
  return ["Court", "Mi-long", "Long", "Extra-long"].map((label, i) => ({ id: slug(label), label, price: prices[i] }));
}

/** Grille extensions 200 g : une ligne par longueur, [foncée, claire, ombré]. */
function extensionGrid(rows: Record<number, [number, number, number]>): Variant[] {
  const colors = ["Couleur foncée", "Couleur claire", "Ombré"];
  return Object.entries(rows).flatMap(([cm, prices]) =>
    colors.map((c, i) => ({ id: `${cm}-${slug(c)}`, label: `${cm} cm · ${c}`, price: prices[i] })),
  );
}

/** Complète prix « dès » à partir des options. */
function withVariants(s: Omit<Service, "price" | "priceFrom"> & { variants: Variant[] }): Service {
  const prices = s.variants.map((v) => v.price);
  const min = Math.min(...prices);
  return { ...s, price: min, priceFrom: Math.max(...prices) > min };
}

export const categoryLabels: Record<ServiceCategory, string> = {
  extensions: "Extensions",
  lissages: "Lissages",
  soins: "Soins",
};

// Tarifs repris des grilles « Price list » de @hairbysd.
// Durées confirmées par Sarah : pose/repose d'extensions 1 h 30, lissages 4 h, soins botox 3 h 30.
// Soin SOS 2 h, dépose + repose Weft 1 h 30.
// Acomptes confirmés : nouvelle pose avec mèches 250, pose sans mèches 20, dépose 20, lissages 20.
// ⚠️ À confirmer : acomptes des soins (botox, SOS), prix de la dépose + repose, durées des déposes, lavage et brushing.
export const services: Service[] = [
  // ── Extensions (cheveux + pose) ──
  withVariants({
    id: "tape-ins-200g",
    category: "extensions",
    name: "Extensions Tape-ins 200 g (pose incluse)",
    description: "Bandes adhésives ultra fines et invisibles, 200 g de cheveux. Prix selon longueur et couleur. Boucles, wavy ou lissé offert.",
    durationMin: 90,
    deposit: 250,
    variants: extensionGrid({
      45: [470, 500, 530], 50: [500, 550, 570], 55: [520, 580, 600],
      60: [540, 600, 630], 65: [580, 630, 650], 70: [600, 650, 680],
    }),
  }),
  withVariants({
    id: "weft-200g",
    category: "extensions",
    name: "Extensions Weft & Medusa Weft 200 g (pose incluse)",
    description: "Pose invisible sans colle et sans chaleur, 200 g de cheveux. Prix selon longueur et couleur. Boucles, wavy ou lissé offert.",
    durationMin: 90,
    deposit: 250,
    variants: extensionGrid({
      45: [480, 530, 550], 50: [510, 550, 580], 55: [550, 580, 610],
      60: [590, 620, 650], 65: [620, 650, 680], 70: [650, 680, 710],
    }),
  }),
  withVariants({
    id: "pose-tape",
    category: "extensions",
    name: "Pose Tape-ins (tes extensions)",
    description: "Pose de bandes adhésives que tu as déjà. Boucles, wavy ou lissé offert.",
    durationMin: 90,
    deposit: 20,
    variants: [
      { id: "hairbysd", label: "Extensions achetées chez Hair by SD", price: 100 },
      { id: "exterieur", label: "Extensions achetées ailleurs", price: 120 },
    ],
  }),
  withVariants({
    id: "depose-tape",
    category: "extensions",
    name: "Dépose Tape-ins",
    description: "Retrait en douceur de tes bandes adhésives, sans abîmer tes cheveux.",
    durationMin: 60,
    deposit: 20,
    variants: [
      { id: "hairbysd", label: "Extensions posées par Hair by SD", price: 30 },
      { id: "exterieur", label: "Extensions posées ailleurs", price: 50 },
    ],
  }),
  withVariants({
    id: "pose-weft",
    category: "extensions",
    name: "Pose Weft / Medusa Weft (tes extensions)",
    description: "Pose de tes wefts sur rangs d'anneaux, sans colle et sans chaleur. Boucles, wavy ou lissé offert.",
    durationMin: 90,
    deposit: 20,
    variants: [
      { id: "hairbysd", label: "Extensions achetées chez Hair by SD", price: 80 },
      { id: "exterieur", label: "Extensions achetées ailleurs", price: 120 },
    ],
  }),
  withVariants({
    id: "depose-weft",
    category: "extensions",
    name: "Dépose Weft",
    description: "Retrait de tes wefts en douceur.",
    durationMin: 45,
    deposit: 20,
    variants: [
      { id: "hairbysd", label: "Extensions posées par Hair by SD", price: 20 },
      { id: "exterieur", label: "Extensions posées ailleurs", price: 30 },
    ],
  }),
  withVariants({
    id: "depose-repose-weft",
    category: "extensions",
    name: "Dépose + repose Weft / Medusa Weft",
    description: "J'enlève tes wefts et je les repose au plus près de la racine. Boucles, wavy ou lissé offert.",
    durationMin: 90,
    deposit: 20,
    // ⚠️ Prix provisoire = dépose + pose de la grille. À confirmer par Sarah.
    variants: [
      { id: "hairbysd", label: "Extensions achetées chez Hair by SD", price: 100 },
      { id: "exterieur", label: "Extensions achetées ailleurs", price: 150 },
    ],
  }),
  withVariants({
    id: "lavage-soin-extensions",
    category: "extensions",
    name: "Lavage + soin avec extensions",
    description: "Lavage et soin adaptés à tes extensions.",
    durationMin: 45,
    deposit: 20,
    variants: [
      { id: "tape", label: "Avec Tape-ins", price: 50 },
      { id: "weft", label: "Avec Weft / Medusa Weft", price: 30 },
    ],
  }),
  withVariants({
    id: "brushing",
    category: "extensions",
    name: "Brushing",
    description: "Brushing coiffé, avec ou sans extensions.",
    durationMin: 60,
    deposit: 20,
    variants: [
      { id: "avec", label: "Avec extensions", price: 50 },
      { id: "sans", label: "Sans extensions", price: 40 },
    ],
  }),
  {
    id: "devis",
    category: "extensions",
    name: "Devis extensions",
    description: "Je viens voir tes cheveux, on choisit ensemble la technique, la longueur et la couleur.",
    durationMin: 30,
    price: 20,
    deposit: 20,
  },
  // ── Lissages (prix selon la longueur) ──
  withVariants({
    id: "lissage-indien",
    category: "lissages",
    name: "Lissage indien",
    description: "Lissage dernière génération : cheveux lisses, brillants et disciplinés pendant des mois.",
    durationMin: 240,
    deposit: 20,
    variants: byLength([200, 220, 250, 280]),
  }),
  withVariants({
    id: "lissage-spiruline",
    category: "lissages",
    name: "Lissage spiruline",
    description: "Lissage enrichi à la spiruline, nourrissant et respectueux de la fibre.",
    durationMin: 240,
    deposit: 20,
    variants: byLength([200, 230, 260, 280]),
  }),
  withVariants({
    id: "lissage-ruby",
    category: "lissages",
    name: "Lissage Ruby",
    description: "Lissage effet miroir pour une brillance intense.",
    durationMin: 240,
    deposit: 20,
    variants: byLength([220, 250, 280, 300]),
  }),
  withVariants({
    id: "lissage-racine-botox",
    category: "lissages",
    name: "Lissage racine + botox longueurs",
    description: "Lissage des racines et soin botox sur les longueurs.",
    durationMin: 240,
    deposit: 20,
    variants: byLength([200, 200, 250, 250]),
  }),
  // ── Soins & extra ──
  {
    id: "botox-spiruline",
    category: "soins",
    name: "Botox spiruline",
    description: "Soin botox capillaire à la spiruline (sans injection) : brillance, douceur, cheveux repulpés.",
    durationMin: 210,
    price: 120,
    deposit: 30,
  },
  {
    id: "botox-lissant",
    category: "soins",
    name: "Botox lissant",
    description: "Soin botox capillaire (sans injection) à effet lissant et anti-frisottis.",
    durationMin: 210,
    price: 150,
    deposit: 30,
  },
  {
    id: "soin-sos",
    category: "soins",
    name: "Soin SOS",
    description: "Soin réparateur intense pour cheveux abîmés ou sensibilisés.",
    durationMin: 120,
    price: 120,
    deposit: 30,
  },
  {
    id: "coupe-fourche",
    category: "soins",
    name: "Coupe fourches",
    description: "Élimination des fourches sans perdre de longueur.",
    durationMin: 30,
    price: 20,
    deposit: 20,
  },
];

// ── Horaires ────────────────────────────────────────────────────────────────
// 0 = dimanche, 1 = lundi … 6 = samedi. null = jour fermé. Heures au format "HH:MM".
export const openingHours: Record<number, { start: string; end: string } | null> = {
  // 24 h/24, 7 j/7 (à la demande de Sarah). Remplace par ex. par { start: "09:00", end: "20:00" } pour limiter.
  0: { start: "00:00", end: "24:00" },
  1: { start: "00:00", end: "24:00" },
  2: { start: "00:00", end: "24:00" },
  3: { start: "00:00", end: "24:00" },
  4: { start: "00:00", end: "24:00" },
  5: { start: "00:00", end: "24:00" },
  6: { start: "00:00", end: "24:00" },
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
