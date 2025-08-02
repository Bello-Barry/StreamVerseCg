#!/data/data/com.termux/files/usr/bin/bash

# Activer l'export automatique des variables
set -o allexport

# Charger les variables depuis .env s'il existe
if [ -f .env ]; then
  source .env
else
  echo "⚠️  Fichier .env introuvable. GITHUB_TOKEN doit être défini manuellement."
fi

# Désactiver l'export automatique
set +o allexport

# 🔒 Vérifier que le token est défini
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Erreur : GITHUB_TOKEN est vide. Abandon."
  exit 1
fi

# ✅ Variables du projet
GITHUB_USERNAME="Bello-Barry"
REPO_NAME="StreamVerseCg"
PROJECT_DIR="/data/data/com.termux/files/home/tvStream-cg"

# Aller dans le projet
cd "$PROJECT_DIR" || { echo "❌ Erreur : dossier $PROJECT_DIR introuvable"; exit 1; }

# Initialiser Git si nécessaire
[ -d .git ] || git init

# Créer un README si absent
[ -f README.md ] || echo "# $REPO_NAME" > README.md

# Ajouter tous les fichiers
git add .

# Faire un commit (même s’il n’y a rien à committer, ignorer l’erreur)
git commit -m "Ajout de tous les fichiers du projet" || echo "ℹ️  Rien à committer"

# Créer ou forcer la branche main
git branch -M main

# Ajouter le remote origin si absent
git remote get-url origin >/dev/null 2>&1 || \
  git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

# Définir l'URL avec token pour push
git remote set-url origin https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

# Push vers main
git push -u origin main || { echo "❌ Échec du push. Vérifie ton token."; exit 1; }

# Nettoyage : remettre l'URL sans token
git remote set-url origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

echo "✅ Push terminé avec succès."