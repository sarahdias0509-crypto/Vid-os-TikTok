---
name: instagram-hairbysd
description: Gère l'Instagram (et TikTok) de @hairbysd, coiffeuse à domicile à Genève spécialisée en extensions (Weft, bandes adhésives), lissages et soins botox capillaires. À utiliser pour écrire des posts, des hooks, des légendes, planifier la semaine, choisir les médias dans Google Drive et programmer les publications dans Metricool (toujours avec validation de Sarah).
---

# Instagram @hairbysd

## Qui est la marque
- **@hairbysd** (Instagram + TikTok), coiffeuse **à domicile à Genève** (pas de salon : elle se déplace chez la cliente).
- Spécialités, par ordre de priorité :
  1. **Extensions de cheveux** — technique **Weft** (tissage de bandes cousues) et **bandes adhésives** (tape-in). C'est le cœur de l'activité : ~60 % des posts.
  2. **Lissages** (brésilien / tanin / kératine selon ce qu'elle propose).
  3. **Soins botox capillaires** (soin profond réparateur, **sans injection**, rien de médical).
- Cible : femmes 20-45 ans, Genève et environs (Carouge, Lancy, Meyrin, Vernier, Nyon, Annemasse / Genevois français).
- Ton : chaleureux, expert, rassurant, féminin, pas vulgaire. **Tutoiement** partout (hooks et légendes).
- **Réservation : uniquement par DM Instagram.** Chaque CTA renvoie vers les DM (ex. « Écris-moi "EXTENSIONS" en DM »). Pas de lien, pas de téléphone.

## Règles non négociables
1. **Validation obligatoire** : rien n'est publié sans l'accord de Sarah. Dans Metricool, toujours `autoPublish: false` (elle reçoit une notification et publie elle-même). Avant de programmer une semaine, montrer d'abord les posts dans le chat et attendre son OK.
2. **Médias** : uniquement ceux de son dossier Drive *HairBySD – Instagram*. **Jamais** le dossier « Studio 144 » ni rien qui ne lui appartient pas.
3. **Consentement** : ne publier un visage de cliente que si Sarah confirme que la cliente a donné son accord.
4. **Soins botox** : préciser que c'est un soin capillaire sans injection ; aucune promesse médicale ni « résultat garanti ».
5. Pas de faux avis, pas de faux chiffres (« 500 clientes ») sauf s'ils viennent de Sarah.
6. Prix : seulement ceux que Sarah donne. Monnaie : CHF.

## Ressources techniques
- **Metricool** : brandId / blogId `8072600`, fuseau `Europe/Zurich`, réseaux `instagram` et `tiktok`.
- **Google Drive** — dossier `HairBySD – Instagram` (`1az2v8spqUrhRUAGne1s0S0de33NfAUHa`) :
  - `1 - Extensions (Weft, bandes adhésives)` → `1mZO9A5DaS8M4NoNgDMXXWw7yp03F2Fq-`
  - `2 - Lissages et soins botox` → `1SDd8ExlAyrExtw4MSXjko0_eWSDD_nU1`
  - `3 - Vidéos brutes (à monter)` → `1iaFDGfD2-bXovgxLdgCZFsrPt3AgFims`
  - `4 - Déjà publié` → `110AMJmjO7V6IYVyrh_TvHB1gh7o1PrwI` (y déplacer un média une fois publié pour ne jamais le reposter)
- Montage : FFmpeg (format 1080×1920, 9:16), sous-titres auto avec `whisper-cli -m /opt/whisper.cpp/models/ggml-base.bin -l fr`.
- Metricool accepte les liens Google Drive dans `media` (Drive est relié à son compte Metricool).

## Meilleurs horaires (Metricool, Instagram)
- **10:00** tous les jours (top : vendredi > mercredi > jeudi).
- **18:00** mardi-jeudi (2e créneau).
- Week-end : audience ~2× plus faible → contenus légers (story, avant/après simple).
- Réévaluer avec `getBestTimeToPostByNetwork` chaque mois quand le compte aura de l'historique.

## Piliers de contenu (rotation hebdo)
| Jour | Pilier | Format |
|---|---|---|
| Lundi | Transformation extensions (avant/après) | Reel |
| Mardi | Éducation : Weft vs bandes adhésives, entretien, durée | Carrousel |
| Mercredi | Transformation lissage ou soin botox | Reel |
| Jeudi | Coulisses à domicile / « je viens chez vous » | Reel ou story |
| Vendredi | Transformation extensions (le meilleur contenu de la semaine) | Reel |
| Samedi | FAQ / mythe vs réalité | Carrousel ou post |
| Dimanche | Avis cliente (texte fourni par Sarah) ou story légère | Post / story |

## Formules de hooks (adapter, ne pas copier tel quel)
**Transformation**
- « De [cheveux fins / courts] à [longueur de rêve] en [durée] — sans bouger de chez elle 🏡 »
- « Elle pensait que ses cheveux ne pousseraient jamais… »
- « Attendez la fin 👀 »
- « POV : ta coiffeuse vient chez toi et tu repars avec 20 cm de plus »

**Éducation**
- « Weft ou bandes adhésives ? Voici comment choisir en 30 secondes »
- « 3 erreurs qui abîment tes extensions (la 2e, tout le monde la fait) »
- « Combien de temps tiennent vraiment des extensions ? »
- « Lissage ou soin botox : lequel pour tes cheveux ? »

**Objections / curiosité**
- « Non, les extensions n'abîment pas tes cheveux… si elles sont bien posées »
- « Ce que personne ne vous dit avant de te faire poser des extensions »
- « Le secret des cheveux longs à Genève 🤫 »

**Local / urgence douce**
- « Coiffeuse extensions à domicile à Genève : il me reste [X] créneaux en [mois] »
- « Mariage, fêtes, vacances ? Réserve tes extensions 2 semaines avant »

## Structure d'une légende
1. **Hook** (1re ligne, < 125 caractères — c'est ce qui s'affiche avant « plus »).
2. **Valeur** : 2-4 lignes courtes (technique utilisée, durée, résultat, conseil).
3. **Preuve / détail** : nombre de bandes, longueur, temps de pose (si Sarah les donne).
4. **Appel à l'action** : « 📩 Écris-moi "EXTENSIONS" en DM pour ton devis » / « Réservation en DM 💌 » / « Enregistre ce post pour plus tard ».
5. **Ligne de localisation** : « 📍 À domicile · Genève et environs »
6. **Hashtags** : 8-15, mélange ci-dessous, en fin de légende (ou en premier commentaire via `firstCommentText`).

## Banque de hashtags
- Local : #geneve #genève #coiffeusegeneve #coiffeuseadomicile #geneva #genevaswitzerland #carouge #suisseromande #lausanne (si pertinent)
- Extensions : #extensionscheveux #extensionsgeneve #weft #weftextensions #tapeinextensions #bandesadhesives #extensionsadhesives #hairextensions #longhair
- Lissage / soin : #lissagebresilien #lissage #botoxcapillaire #soincapillaire #cheveuxlisses #hairbotox
- Marque : #hairbysd
Varier d'un post à l'autre (Instagram pénalise les blocs identiques répétés).

## Workflow : préparer une semaine
1. `getBrandSettings` → vérifier brandId et fuseau.
2. `getScheduledPosts` sur la semaine → ne pas doubler.
3. Lister les médias neufs dans les dossiers Drive 1, 2 et 3 (pas dans 4).
4. Vidéos brutes → monter en Reel 9:16 (FFmpeg) + sous-titres (Whisper) si on parle dans la vidéo.
5. Rédiger les 7 posts (pilier du jour + hook + légende + hashtags + heure).
6. **Montrer le tableau complet à Sarah et attendre son OK.**
7. Programmer chaque post validé avec `createScheduledPost`, `autoPublish: false`, `instagramData.type` = `REEL` (vidéo) ou `POST` (image/carrousel), `isAiGenerated: false` pour ses vraies photos.
8. Donner les liens `plannerUrl` à Sarah.

## Si le média manque
Ne jamais publier sans visuel (Instagram le refuse). Demander à Sarah de déposer des photos/vidéos dans le bon dossier Drive, ou proposer un carrousel texte sur fond uni (à valider).
