# Caisses d'Obus (PWA iPhone)

Application d'une seule page, 100 % hors ligne après installation.
Aucun serveur applicatif, aucun compte dans l'app, aucun abonnement.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | La page unique de l'application |
| `style.css` | Thème noir / kaki / vert, gros chiffres blancs |
| `app.js` | Calcul instantané des charges excédentaires, sauvegarde automatique |
| `manifest.json` | Rend l'app installable (nom, icônes, plein écran) |
| `service-worker.js` | Met tout en cache : l'app s'ouvre sans Internet |
| `*.png` | Icônes de l'écran d'accueil |

## Règle de calcul

- 1 caisse = 6 obus (fixe). 1 obus = 6 charges (fixe). 1 charge = 1 niveau.
- Total d'obus = caisses × 6.
- Charges excédentaires = total d'obus × (6 − charge demandée).
- Charges conservées = total d'obus × charge demandée.

Exemple : 5 caisses → 30 obus. Charge 4 → 6 − 4 = 2 en trop par obus → 30 × 2 = **60 charges excédentaires**.

## Installation sur iPhone

iOS n'autorise l'installation d'une PWA que depuis une adresse **https://**.
Il faut donc publier les fichiers **une seule fois** sur un hébergement statique gratuit.
Ensuite, l'app fonctionne sans Internet.

### Étape 1 — Publier les fichiers (une seule fois, depuis un ordinateur)

**GitHub Pages (gratuit, permanent) :**
1. Créez un compte sur github.com.
2. Nouveau dépôt (« New repository »), nom par ex. `caisses-obus`, visibilité Public.
3. « Add file » → « Upload files » → glissez **tout le contenu** du dossier
   (index.html, style.css, app.js, manifest.json, service-worker.js et les 4 icônes .png).
4. « Commit changes ».
5. Settings → Pages → Source : « Deploy from a branch », branche `main`, dossier `/ (root)` → Save.
6. Après 1 à 2 minutes, l'adresse apparaît : `https://VOTRE-NOM.github.io/caisses-obus/`.

### Étape 2 — Installer sur l'iPhone

1. Ouvrez l'adresse dans **Safari** (obligatoire pour l'installation).
2. Attendez que la page soit complètement chargée (2–3 secondes) : c'est là que tout est mis en cache.
3. Touchez le bouton **Partager** (carré avec flèche vers le haut).
4. Faites défiler et choisissez **« Sur l'écran d'accueil »**.
5. Gardez le nom « Caisses », touchez **Ajouter**.
6. Ouvrez l'app une fois depuis l'icône, avec Internet, pour finaliser.

### Étape 3 — Vérifier le mode hors ligne

1. Activez le mode Avion.
2. Ouvrez « Caisses » depuis l'écran d'accueil : l'app s'affiche normalement,
   le bas de page indique « Mode hors ligne ».

## Utilisation

1. **Nombre de caisses** : + / −. Maintenir appuyé pour défiler vite (par 10 après 2–3 s).
2. **Charge demandée** : touchez 1 à 6. La jauge montre en vert les charges conservées, en rouge les charges en trop.
3. **Total d'obus**, **Charge** et **Charges excédentaires** se mettent à jour immédiatement.
4. **Tirs par pièce** : chaque appui sur **P1** ou **P2** compte 1 obus tiré pour cette pièce.
   « Annuler dernier tir » sous chaque bouton retire 1 tir à cette pièce.
   **Reste X obus** = total d'obus − tirs de P1 − tirs de P2.
5. À **0 obus restant**, P1 et P2 se bloquent et un bilan s'affiche :
   tirs de P1, tirs de P2, charges excédentaires.
6. **Réinitialiser** : remet tout à zéro (caisses, charge, tirs). Un bouton « Annuler » apparaît 5 secondes.

Les dernières valeurs sont sauvegardées automatiquement sur l'iPhone.

## Bon à savoir

- Ne supprimez pas le site GitHub : l'app installée n'en a pas besoin pour fonctionner,
  mais il permet de la réinstaller ou de la mettre à jour.
- Supprimer l'icône de l'écran d'accueil efface aussi les valeurs sauvegardées.
- Mise à jour : modifiez les fichiers, changez `VERSION` dans `service-worker.js`
  (ex. `caisses-obus-v5`), republiez, puis ouvrez l'app avec Internet deux fois.
