#!/data/data/com.termux/files/usr/bin/bash

# Charger les variables d'environnement depuis le .env
set -o allexport
source .env
set +o allexport

# Variables fixes
GITHUB_USERNAME="Bello-Barry"
REPO_NAME="StreamVerseCg"
PROJECT_DIR="/data/data/com.termux/files/home/tvStream-cg"

# Aller dans ton projet
cd $PROJECT_DIR

# Initialiser Git si pas déjà fait
git init

# Créer README si pas déjà là
[ -f README.md ] || echo "# $REPO_NAME" > README.md

# Ajouter tous les fichiers
git add .

# Commit si modifs
git commit -m "Ajout de tous les fichiers du projet" || echo "Rien à committer"

# Créer la branche main
git branch -M main

# Ajouter le remote origin (si pas déjà fait)
git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git 2>/dev/null

# Configurer l'URL distante AVEC le token
git remote set-url origin https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

# Push vers main
git push -u origin main

# (Optionnel) Remettre l'URL propre sans token après push
git remote set-url origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git