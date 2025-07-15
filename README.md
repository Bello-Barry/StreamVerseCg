# StreamVerse - IPTV Player 📺

Une application de streaming IPTV moderne, responsive et progressive (PWA) avec support M3U/M3U8 et Xtream Codes.

![StreamVerse Logo](./public/icons/icon-192x192.png)

## ✨ Fonctionnalités

### 🎯 Fonctionnalités Principales
- **Support Multi-Format** : M3U, M3U8 et Xtream Codes
- **Playlists Par Défaut** : Chaînes françaises pré-configurées
- **Progressive Web App** : Installation sur mobile et desktop
- **Mode Hors Ligne** : Fonctionnement partiel sans internet
- **Responsive Design** : Optimisé pour tous les écrans
- **Thème Sombre/Clair** : Basculement automatique ou manuel

### 📱 Interface Utilisateur
- **Design Moderne** : Interface glassmorphism avec animations fluides
- **Navigation Intuitive** : Menu adaptatif et recherche en temps réel
- **Gestion Simplifiée** : Ajout/suppression de playlists en quelques clics
- **Statuts Visuels** : Indicateurs clairs de l'état des chaînes

### 🔧 Fonctionnalités Techniques
- **Service Worker** : Cache intelligent pour les performances
- **TypeScript** : Code typé pour une meilleure maintenabilité
- **Next.js 15** : Framework React moderne avec Turbopack
- **Zustand** : Gestion d'état légère et performante

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation
```bash
# Cloner le repository
git clone https://github.com/Bello-Barry/StreamVerseCg.git
cd StreamVerseCg

# Installer les dépendances
npm install

# Démarrer en mode développement
npm run dev
```

### Build de Production
```bash
# Construire l'application
npm run build

# Démarrer en production
npm start
```

## 📋 Configuration des Playlists

### Playlists Par Défaut
L'application inclut deux playlists françaises pré-configurées :

1. **Chaînes Françaises (Schumijo)**
   - URL : `https://raw.githubusercontent.com/schumijo/iptv/main/fr.m3u8`
   - Contenu : Chaînes françaises populaires
   - Statut : Non supprimable

2. **IPTV-Org (France)**
   - URL : `https://iptv-org.github.io/iptv/languages/fra.m3u`
   - Contenu : Chaînes françaises officielles
   - Statut : Non supprimable

### Ajouter une Playlist M3U/M3U8
1. Cliquer sur "Gérer les playlists"
2. Cliquer sur "Ajouter une playlist"
3. Sélectionner le type "URL"
4. Remplir les informations :
   - **Nom** : Nom de votre playlist
   - **URL** : Lien vers votre fichier M3U/M3U8
   - **Description** : Description optionnelle

### Ajouter un Serveur Xtream Codes
1. Cliquer sur "Gérer les playlists"
2. Cliquer sur "Ajouter une playlist"
3. Sélectionner le type "Xtream Codes"
4. Remplir les informations :
   - **Nom** : Nom de votre serveur
   - **Serveur** : URL du serveur Xtream
   - **Nom d'utilisateur** : Votre identifiant
   - **Mot de passe** : Votre mot de passe
   - **Description** : Description optionnelle

## 🎨 Personnalisation

### Thèmes
- **Mode Automatique** : Suit les préférences système
- **Mode Sombre** : Interface sombre pour un confort visuel
- **Mode Clair** : Interface claire et lumineuse

### Responsive Design
- **Mobile** : Interface optimisée pour smartphones
- **Tablette** : Adaptation pour écrans moyens
- **Desktop** : Expérience complète sur grand écran
- **TV** : Compatible avec les écrans de télévision

## 🔧 Architecture Technique

### Structure du Projet
```
src/
├── app/                    # Pages Next.js
├── components/            # Composants React
│   ├── pages/            # Composants de pages
│   └── ui/               # Composants UI réutilisables
├── lib/                  # Utilitaires et helpers
│   ├── m3uParser.ts     # Parser M3U/M3U8
│   └── xtreamParser.ts  # Parser Xtream Codes
├── stores/              # Stores Zustand
├── types/               # Types TypeScript
└── hooks/               # Hooks React personnalisés
```

### Technologies Utilisées
- **Frontend** : Next.js 15, React 18, TypeScript
- **Styling** : Tailwind CSS, CSS Modules
- **État** : Zustand
- **UI** : Shadcn/ui, Lucide Icons
- **PWA** : Service Worker, Web App Manifest
- **Build** : Turbopack, ESLint, Prettier

## 📱 Progressive Web App (PWA)

### Installation
1. **Sur Mobile** : Ouvrir dans le navigateur et suivre les instructions d'installation
2. **Sur Desktop** : Cliquer sur l'icône d'installation dans la barre d'adresse

### Fonctionnalités PWA
- **Installation Native** : Icône sur l'écran d'accueil
- **Mode Hors Ligne** : Accès aux playlists en cache
- **Notifications** : Alertes pour les mises à jour (futur)
- **Synchronisation** : Mise à jour automatique en arrière-plan

## 🔒 Sécurité et Confidentialité

### Données Locales
- **Stockage Local** : Les playlists sont stockées dans le navigateur
- **Pas de Serveur** : Aucune donnée n'est envoyée à des serveurs tiers
- **Chiffrement** : Les données sensibles sont protégées

### CORS et Sécurité
- **Proxy Intégré** : Contournement des restrictions CORS
- **Validation** : Vérification des URLs et formats
- **Sanitisation** : Nettoyage des données d'entrée

## 🐛 Dépannage

### Problèmes Courants

#### Playlist ne se charge pas
- Vérifier l'URL de la playlist
- S'assurer que le serveur est accessible
- Vérifier les paramètres Xtream Codes

#### Application lente
- Vider le cache du navigateur
- Désactiver les playlists non utilisées
- Vérifier la connexion internet

#### Erreurs d'affichage
- Actualiser la page
- Vérifier la compatibilité du navigateur
- Désactiver les extensions de navigateur

### Support des Navigateurs
- **Chrome** : 90+ ✅
- **Firefox** : 88+ ✅
- **Safari** : 14+ ✅
- **Edge** : 90+ ✅

## 🤝 Contribution

### Développement Local
```bash
# Fork le repository
git clone https://github.com/votre-username/StreamVerseCg.git

# Créer une branche
git checkout -b feature/nouvelle-fonctionnalite

# Faire vos modifications
# ...

# Commit et push
git commit -m "Ajout de nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite

# Créer une Pull Request
```

### Guidelines
- Utiliser TypeScript pour tout nouveau code
- Suivre les conventions de nommage existantes
- Ajouter des tests pour les nouvelles fonctionnalités
- Documenter les changements dans le CHANGELOG

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **IPTV-Org** : Pour les playlists communautaires
- **Schumijo** : Pour les chaînes françaises
- **Next.js Team** : Pour le framework
- **Vercel** : Pour l'hébergement

## 📞 Contact

- **GitHub** : [Bello-Barry](https://github.com/Bello-Barry)
- **Demo** : [stream-verse-cg.vercel.app](https://stream-verse-cg.vercel.app)

---

*Développé avec ❤️ pour une expérience IPTV moderne et intuitive*

