# Studio Meraki — Site vitrine

Site statique (HTML/CSS/JS vanilla) pour **Studio Meraki**, un studio de danse à Aubière (63), proche Clermont-Ferrand. Ouverture prévue septembre 2026.

## Stack

- HTML5 + CSS3 + JS vanilla (pas de framework, pas de bundler)
- Police : Fredoka (titres) + Inter (corps) via Google Fonts
- Smooth scroll : Lenis (CDN)
- Formulaires : Web3Forms (`https://api.web3forms.com/submit`)
- Hébergement : lestudiomeraki.fr (domaine en prod)

## Fichiers principaux

| Fichier | Rôle |
|---|---|
| `index.html` | Page principale (toutes sections : hero, cours, planning, tarifs, contact) |
| `reservation.html` | Formulaire d'inscription / cours d'essai |
| `styles.css` | Toute la CSS (~1950 lignes) |
| `script.js` | Comportements JS (autoplay vidéo, Lenis, nav mobile, filtres créneaux, formulaires) |
| `mentions-legales.html` | Mentions légales |
| `cgv.html` | Conditions générales de vente |
| `politique-de-confidentialite.html` | RGPD |
| `assets/` | Images (webp + png fallback), vidéos (hero-disco.mp4, video_banner.mp4), favicon |

## Architecture CSS

Pas de variables CSS exposées publiquement — les couleurs et tokens sont définis inline dans les sélecteurs. La hiérarchie est organisée par section (`site-header`, `hero`, `cours`, `planning`, `tarifs`, `reservation-*`, etc.).

## Formulaires

Deux formulaires soumis via Web3Forms :
- **Contact** (`[data-contact-form]`) → `index.html`
- **Réservation** (`[data-reservation-form]`) → `reservation.html`

L'access key Web3Forms est `8e8f6cb1-5e11-4993-8664-275f53d3d586` (visible dans le HTML, pas un secret à protéger).

## Disciplines proposées

Modern · Street · Street Latino · Heels · Comédie Musicale · Glam · Broadway · Loisirs · Technique — pour enfants, ados et adultes.

## Créneaux / réservations

Les créneaux sont codés en dur dans `reservation.html` avec `data-slot-group` par discipline. Un créneau "complet" est désactivé via l'attribut `disabled` sur l'`<input type="checkbox">` + classe `is-full` sur le `<label>`. Le JS dans `script.js` filtre l'affichage des groupes selon les disciplines cochées.

## Conventions

- Pas de build step — modifier directement les fichiers et tester dans un navigateur
- Images : privilégier `.webp` avec fallback `.png` via `<picture>`
- Texte toujours en français
- Pas de commentaires dans le code sauf si l'intention est non évidente
