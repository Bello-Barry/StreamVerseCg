#!/bin/bash

# Script d'application des corrections StreamVerseCg
# Exécutez ce script depuis la racine de votre projet StreamVerseCg

echo "🔧 Application des corrections StreamVerseCg..."
echo "==============================================="

# Vérification que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet StreamVerseCg"
    echo "   (le répertoire contenant package.json)"
    exit 1
fi

# Sauvegarde des fichiers originaux
echo "📦 Création des sauvegardes..."
mkdir -p backups_$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups_$(date +%Y%m%d_%H%M%S)"

cp package.json "$BACKUP_DIR/package.json.backup" 2>/dev/null
cp tailwind.config.js "$BACKUP_DIR/tailwind.config.js.backup" 2>/dev/null
cp postcss.config.js "$BACKUP_DIR/postcss.config.js.backup" 2>/dev/null
cp src/app/globals.css "$BACKUP_DIR/globals.css.backup" 2>/dev/null
cp src/components/pages/NotificationsPage.tsx "$BACKUP_DIR/NotificationsPage.tsx.backup" 2>/dev/null

echo "✅ Sauvegardes créées dans: $BACKUP_DIR"

# Application des corrections
echo "🔄 Application des corrections..."

# Déterminer le répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Copie des fichiers corrigés
echo "  📄 Mise à jour de package.json..."
cp "$SCRIPT_DIR/package.json" ./package.json

echo "  📄 Mise à jour de tailwind.config.js..."
cp "$SCRIPT_DIR/tailwind.config.js" ./tailwind.config.js

echo "  📄 Mise à jour de postcss.config.js..."
cp "$SCRIPT_DIR/postcss.config.js" ./postcss.config.js

echo "  📄 Mise à jour de src/app/globals.css..."
cp "$SCRIPT_DIR/globals.css" ./src/app/globals.css

echo "  📄 Mise à jour de src/components/pages/NotificationsPage.tsx..."
cp "$SCRIPT_DIR/NotificationsPage.tsx" ./src/components/pages/NotificationsPage.tsx

echo "✅ Tous les fichiers ont été mis à jour!"

# Réinstallation des dépendances
echo "📦 Réinstallation des dépendances..."
if command -v pnpm &> /dev/null; then
    echo "  🔧 Utilisation de pnpm..."
    pnpm install
elif command -v npm &> /dev/null; then
    echo "  🔧 Utilisation de npm..."
    npm install
else
    echo "❌ Erreur: npm ou pnpm requis pour installer les dépendances"
    exit 1
fi

echo ""
echo "🎉 CORRECTIONS APPLIQUÉES AVEC SUCCÈS!"
echo "======================================"
echo ""
echo "✅ Problèmes résolus:"
echo "  • Configuration TailwindCSS corrigée (v4 → v3)"
echo "  • Erreur d'hydratation React résolue"
echo "  • Overlays numériques supprimés"
echo "  • Styles correctement appliqués"
echo ""
echo "🚀 Prochaines étapes:"
echo "  1. Exécutez: npm run dev (ou pnpm dev)"
echo "  2. Testez l'application sur http://localhost:3000"
echo "  3. Vérifiez que les pages fonctionnent correctement"
echo ""
echo "📁 Sauvegardes disponibles dans: $BACKUP_DIR"
echo "   (pour revenir en arrière si nécessaire)"
echo ""
