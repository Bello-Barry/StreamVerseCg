# Guide de Contribution - StreamVerse

Merci de votre intérêt pour contribuer à StreamVerse ! Ce guide vous aidera à comprendre comment participer efficacement au développement de cette application IPTV moderne.

## Table des matières

1. [Code de conduite](#code-de-conduite)
2. [Comment contribuer](#comment-contribuer)
3. [Configuration de l'environnement](#configuration-de-lenvironnement)
4. [Standards de développement](#standards-de-développement)
5. [Processus de Pull Request](#processus-de-pull-request)
6. [Types de contributions](#types-de-contributions)
7. [Architecture et conventions](#architecture-et-conventions)
8. [Tests et qualité](#tests-et-qualité)

## Code de conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite. Nous nous engageons à maintenir un environnement accueillant et inclusif pour tous les contributeurs.

### Nos engagements

- Utiliser un langage accueillant et inclusif
- Respecter les différents points de vue et expériences
- Accepter les critiques constructives avec grâce
- Se concentrer sur ce qui est le mieux pour la communauté
- Faire preuve d'empathie envers les autres membres

## Comment contribuer

### Signaler des bugs

Avant de signaler un bug, vérifiez qu'il n'a pas déjà été rapporté dans les [Issues GitHub](https://github.com/streamverse/streamverse-nextjs/issues).

Pour signaler un bug :

1. Utilisez le template d'issue "Bug Report"
2. Décrivez le comportement attendu vs observé
3. Fournissez les étapes pour reproduire le problème
4. Incluez des captures d'écran si pertinent
5. Précisez votre environnement (OS, navigateur, version)

### Proposer des fonctionnalités

Pour proposer une nouvelle fonctionnalité :

1. Vérifiez qu'elle n'est pas déjà en développement
2. Utilisez le template "Feature Request"
3. Expliquez le problème que cela résoudrait
4. Décrivez la solution proposée
5. Considérez les alternatives possibles

### Première contribution

Recherchez les issues étiquetées `good first issue` ou `help wanted`. Ces issues sont spécialement sélectionnées pour les nouveaux contributeurs.

## Configuration de l'environnement

### Prérequis

- Node.js 18.0 ou supérieur
- npm, yarn ou pnpm
- Git
- Éditeur de code (VS Code recommandé)

### Installation

1. **Fork et clone**
```bash
git clone https://github.com/votre-username/streamverse-nextjs.git
cd streamverse-nextjs
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration VS Code (recommandé)**

Installez les extensions recommandées :
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Auto Rename Tag

4. **Variables d'environnement**
```bash
cp .env.example .env.local
# Éditez .env.local selon vos besoins
```

5. **Démarrer le serveur de développement**
```bash
npm run dev
```

## Standards de développement

### Structure des commits

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/) :

```
type(scope): description

[corps optionnel]

[footer optionnel]
```

**Types autorisés :**
- `feat`: nouvelle fonctionnalité
- `fix`: correction de bug
- `docs`: documentation
- `style`: formatage, point-virgules manquants, etc.
- `refactor`: refactorisation du code
- `test`: ajout ou modification de tests
- `chore`: maintenance, dépendances, etc.

**Exemples :**
```
feat(player): add HLS.js video player support
fix(search): resolve category filtering issue
docs(readme): update installation instructions
```

### Standards de code

#### TypeScript

- Utilisez TypeScript strict mode
- Définissez des types explicites pour les props
- Évitez `any`, préférez `unknown` si nécessaire
- Utilisez des interfaces pour les objets complexes

```typescript
// ✅ Bon
interface ChannelProps {
  channel: Channel;
  onPlay: (channel: Channel) => void;
  isFavorite: boolean;
}

// ❌ Éviter
const ChannelCard = (props: any) => {
  // ...
};
```

#### React

- Utilisez des composants fonctionnels avec hooks
- Préférez les named exports
- Utilisez React.memo pour les composants coûteux
- Gérez les états locaux avec useState/useReducer

```typescript
// ✅ Bon
export const ChannelCard: React.FC<ChannelProps> = React.memo(({ 
  channel, 
  onPlay, 
  isFavorite 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <Card>
      {/* contenu */}
    </Card>
  );
});
```

#### Styling avec Tailwind

- Utilisez les classes utilitaires Tailwind
- Créez des composants réutilisables pour les patterns communs
- Utilisez les variantes responsive
- Préférez les classes Tailwind aux styles inline

```typescript
// ✅ Bon
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">

// ❌ Éviter
<div style={{ display: 'flex', padding: '16px' }}>
```

### Architecture des composants

#### Structure des dossiers

```
src/components/
├── ui/                 # Composants Shadcn UI
├── pages/              # Composants de pages
├── layout/             # Composants de mise en page
└── common/             # Composants réutilisables
```

#### Conventions de nommage

- **Composants** : PascalCase (`ChannelCard.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useChannelData.ts`)
- **Stores** : camelCase avec préfixe `use` et suffixe `Store` (`usePlaylistStore.ts`)
- **Types** : PascalCase (`Channel`, `PlaylistData`)
- **Constantes** : SCREAMING_SNAKE_CASE (`DEFAULT_PLAYLIST_URL`)

#### Props et interfaces

```typescript
// Définir les props avec une interface
interface ChannelCardProps {
  channel: Channel;
  onPlay: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  isFavorite: boolean;
  showCategory?: boolean;
  className?: string;
}

// Utiliser des valeurs par défaut
export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onPlay,
  onToggleFavorite,
  isFavorite,
  showCategory = true,
  className = '',
}) => {
  // ...
};
```

### Gestion d'état avec Zustand

#### Structure des stores

```typescript
interface PlaylistState {
  // État
  playlists: Playlist[];
  channels: Channel[];
  loading: boolean;
  error: string | null;
  
  // Actions
  addPlaylist: (playlist: PlaylistFormData) => Promise<void>;
  removePlaylist: (id: string) => void;
  updatePlaylist: (id: string, data: Partial<Playlist>) => void;
  
  // Sélecteurs
  getChannelsByCategory: (category: string) => Channel[];
  getPlaylistById: (id: string) => Playlist | undefined;
}
```

#### Persistance des données

```typescript
export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      // état et actions
    }),
    {
      name: 'playlist-storage',
      partialize: (state) => ({
        playlists: state.playlists,
        // Exclure les données temporaires
      }),
    }
  )
);
```

## Processus de Pull Request

### Avant de soumettre

1. **Synchronisez votre fork**
```bash
git checkout main
git pull upstream main
git push origin main
```

2. **Créez une branche feature**
```bash
git checkout -b feat/nouvelle-fonctionnalite
```

3. **Développez et testez**
```bash
npm run test
npm run lint
npm run type-check
npm run build
```

4. **Commitez vos changements**
```bash
git add .
git commit -m "feat(scope): description de la fonctionnalité"
```

### Soumission de la PR

1. **Poussez votre branche**
```bash
git push origin feat/nouvelle-fonctionnalite
```

2. **Créez la Pull Request**
- Utilisez le template de PR fourni
- Décrivez clairement les changements
- Liez les issues concernées
- Ajoutez des captures d'écran si pertinent

3. **Template de PR**
```markdown
## Description
Brève description des changements apportés.

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests manuels effectués
- [ ] Tests de régression passés

## Checklist
- [ ] Code suit les standards du projet
- [ ] Auto-review effectuée
- [ ] Documentation mise à jour
- [ ] Pas de warnings de build
```

### Review et merge

1. **Review automatique**
   - Tests CI/CD passent
   - Vérifications de qualité de code
   - Analyse de sécurité

2. **Review manuelle**
   - Au moins une approbation requise
   - Vérification de la conformité aux standards
   - Test des fonctionnalités

3. **Merge**
   - Squash and merge pour les features
   - Rebase and merge pour les fixes simples

## Types de contributions

### Développement de fonctionnalités

#### Nouvelles pages

1. Créer le composant dans `src/components/pages/`
2. Ajouter les types nécessaires
3. Implémenter les tests
4. Mettre à jour la navigation
5. Documenter l'utilisation

#### Nouveaux composants UI

1. Suivre les patterns Shadcn UI
2. Implémenter les variantes nécessaires
3. Ajouter les props TypeScript
4. Créer les stories Storybook
5. Tester l'accessibilité

#### Stores Zustand

1. Définir l'interface d'état
2. Implémenter les actions
3. Ajouter la persistance si nécessaire
4. Créer les sélecteurs
5. Tester les mutations

### Documentation

#### README et guides

- Utiliser Markdown avec syntaxe GitHub
- Inclure des exemples de code
- Ajouter des captures d'écran
- Maintenir la table des matières
- Vérifier les liens

#### Commentaires de code

```typescript
/**
 * Parse un fichier M3U et extrait les informations des chaînes
 * @param content - Contenu du fichier M3U
 * @param source - Source de la playlist (pour traçabilité)
 * @returns Résultat du parsing avec chaînes et métadonnées
 */
export function parseM3U(content: string, source: string): M3UParseResult {
  // ...
}
```

### Tests

#### Tests unitaires

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ChannelCard } from './ChannelCard';

describe('ChannelCard', () => {
  const mockChannel = {
    id: '1',
    name: 'Test Channel',
    url: 'http://example.com/stream',
    group: 'General',
  };

  it('should render channel name', () => {
    render(
      <ChannelCard 
        channel={mockChannel} 
        onPlay={jest.fn()} 
        onToggleFavorite={jest.fn()}
        isFavorite={false}
      />
    );
    
    expect(screen.getByText('Test Channel')).toBeInTheDocument();
  });

  it('should call onPlay when play button is clicked', () => {
    const onPlay = jest.fn();
    render(
      <ChannelCard 
        channel={mockChannel} 
        onPlay={onPlay} 
        onToggleFavorite={jest.fn()}
        isFavorite={false}
      />
    );
    
    fireEvent.click(screen.getByText('Regarder'));
    expect(onPlay).toHaveBeenCalledWith(mockChannel);
  });
});
```

#### Tests d'intégration

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePlaylistStore } from './usePlaylistStore';

describe('usePlaylistStore', () => {
  beforeEach(() => {
    usePlaylistStore.getState().reset();
  });

  it('should add playlist correctly', async () => {
    const { result } = renderHook(() => usePlaylistStore());
    
    await act(async () => {
      await result.current.addPlaylist({
        name: 'Test Playlist',
        url: 'http://example.com/playlist.m3u',
        type: 'url',
      });
    });
    
    expect(result.current.playlists).toHaveLength(1);
    expect(result.current.playlists[0].name).toBe('Test Playlist');
  });
});
```

## Architecture et conventions

### Patterns de design

#### Composition over inheritance

```typescript
// ✅ Bon - Composition
interface WithLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
}

const WithLoading: React.FC<WithLoadingProps> = ({ isLoading, children }) => {
  if (isLoading) return <Spinner />;
  return <>{children}</>;
};

// Utilisation
<WithLoading isLoading={loading}>
  <ChannelList channels={channels} />
</WithLoading>
```

#### Custom hooks pour la logique

```typescript
// Hook personnalisé pour la gestion des chaînes
export const useChannelManagement = () => {
  const { channels, addToFavorites } = usePlaylistStore();
  const { addToHistory } = useWatchHistoryStore();
  
  const playChannel = useCallback((channel: Channel) => {
    addToHistory(channel, 0);
    // Logique de lecture
  }, [addToHistory]);
  
  const toggleFavorite = useCallback((channelId: string) => {
    addToFavorites(channelId);
  }, [addToFavorites]);
  
  return {
    channels,
    playChannel,
    toggleFavorite,
  };
};
```

### Performance

#### Optimisations React

```typescript
// Mémorisation des composants coûteux
const ChannelCard = React.memo<ChannelCardProps>(({ channel, onPlay }) => {
  return (
    <Card>
      {/* contenu */}
    </Card>
  );
});

// Mémorisation des callbacks
const HomePage: React.FC = () => {
  const handleChannelPlay = useCallback((channel: Channel) => {
    // logique
  }, []);
  
  const filteredChannels = useMemo(() => {
    return channels.filter(channel => 
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);
  
  return (
    <div>
      {filteredChannels.map(channel => (
        <ChannelCard 
          key={channel.id}
          channel={channel}
          onPlay={handleChannelPlay}
        />
      ))}
    </div>
  );
};
```

#### Lazy loading

```typescript
// Chargement paresseux des pages
const SearchPage = lazy(() => import('./pages/SearchPage'));
const PlayerPage = lazy(() => import('./pages/PlayerPage'));

// Utilisation avec Suspense
<Suspense fallback={<PageSkeleton />}>
  <SearchPage />
</Suspense>
```

### Accessibilité

#### Standards WCAG

- Utiliser des éléments sémantiques HTML
- Fournir des alternatives textuelles
- Assurer un contraste suffisant
- Support navigation clavier
- Tester avec lecteurs d'écran

```typescript
// Exemple d'accessibilité
<button
  aria-label={`Ajouter ${channel.name} aux favoris`}
  aria-pressed={isFavorite}
  onClick={() => onToggleFavorite(channel.id)}
  className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
>
  <Heart className={isFavorite ? 'fill-red-500' : ''} />
</button>
```

## Tests et qualité

### Configuration des tests

#### Jest configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### Setup des tests

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Mocking

#### MSW pour les API

```typescript
// src/test/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('*/playlist.m3u', (req, res, ctx) => {
    return res(
      ctx.text(`#EXTM3U
#EXTINF:-1,Test Channel
http://example.com/stream.m3u8`)
    );
  }),
];
```

#### Mock des stores

```typescript
// src/test/mocks/stores.ts
export const mockPlaylistStore = {
  playlists: [],
  channels: [],
  loading: false,
  error: null,
  addPlaylist: jest.fn(),
  removePlaylist: jest.fn(),
};
```

### Outils de qualité

#### ESLint configuration

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

#### Prettier configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Ressources et support

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)
- [Zustand](https://github.com/pmndrs/zustand)

### Communauté

- **Discord** : [discord.gg/streamverse](https://discord.gg/streamverse)
- **GitHub Discussions** : Pour les questions générales
- **Stack Overflow** : Tag `streamverse`

### Contact des mainteneurs

- **Issues GitHub** : Pour les bugs et features
- **Email** : dev@streamverse.app
- **Twitter** : [@StreamVerseDev](https://twitter.com/StreamVerseDev)

---

Merci de contribuer à StreamVerse ! Votre participation aide à créer une meilleure expérience pour tous les utilisateurs de l'application.

*Dernière mise à jour : Juillet 2025*

