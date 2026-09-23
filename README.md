# 🎮 TaskQuest

Application de suivi de tâches gamifiée, inspirée de Habitica / Pixelio, avec un style **pixel moderne**.
Installable directement sur Android comme une app (PWA), sans passer par le Play Store.

## ✨ Fonctionnalités

- **Accueil** : liste des tâches du jour, avec niveau, XP et pièces affichés en haut.
- **Création de tâches** : bouton `+` en bas → nom, émoji, difficulté (facile/moyen/difficile → XP différent), moment de la journée.
- **Récap de fin de journée** (à l'heure choisie dans les paramètres) : style "fin de niveau" à la Kirby and the Forgotten Land — résultats des tâches, XP et pièces gagnées, puis choix de l'humeur du jour (super / bien / milieu / bof / mal / catastrophe, chacune avec sa couleur).
- **Statistiques** : score du jour en %, historique d'humeur sur 7 jours, niveau général.
- **Boutique** : thèmes, icônes d'app, coffres gacha (normal / super) pour débloquer des images de profil sans doublon.
- **Paramètres** : heure du récap, heure et activation des notifications, âge (pour calculer le niveau général), réinitialisation des données.
- **Niveaux** :
  - *Niveau de base* : progresse avec les tâches, se réinitialise périodiquement.
  - *Niveau général* : estimé à l'installation selon l'âge, augmente d'environ 1 niveau par mois, ne se réinitialise jamais.

## 📲 Installation sur Android

1. Va sur `Settings > Pages` du repo GitHub pour activer **GitHub Pages** (branche `main`, dossier racine).
2. Ouvre l'URL GitHub Pages générée depuis ton téléphone (Chrome).
3. Appuie sur le menu ⋮ → **"Ajouter à l'écran d'accueil"** / **"Installer l'application"**.
4. L'app s'installe comme une vraie application, avec icône et plein écran !

## 🛠️ Structure du projet

```
index.html          → structure des pages (accueil, stats, boutique, paramètres, récap)
style.css           → style pixel/moderne
app.js              → logique de l'app (tâches, XP, niveaux, récap, boutique, notifications)
manifest.json       → config PWA (icône, nom, couleurs)
service-worker.js   → mise en cache pour fonctionnement hors-ligne
```

## 🚧 À venir

- Nouvelles pages débloquées par les pièces.
- Sons personnalisés de notification (style Duolingo).
- Musique de récap type "Wild Results".
