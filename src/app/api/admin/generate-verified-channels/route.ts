
// 2. API Route pour générer le fichier verified-channels.json
// app/api/admin/generate-verified-channels/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Clé secrète admin (à mettre dans .env.local)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Vérification basique d'authentification
    const { secret, favorites, allChannels } = await request.json();
    
    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Filtrer les chaînes favorites depuis tous les chaînes disponibles
    const verifiedChannels = allChannels.filter((channel: any) => 
      favorites.includes(channel.id)
    );

    // Enrichir les données avec des métadonnées
    const enrichedChannels = verifiedChannels.map((channel: any) => ({
      ...channel,
      verified: true,
      verifiedAt: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      quality: 'verified', // Tu peux ajouter d'autres métadonnées
    }));

    // Créer l'objet final
    const verifiedData = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalChannels: enrichedChannels.length,
      channels: enrichedChannels,
      metadata: {
        generatedBy: 'StreamVerse Admin',
        generatedAt: new Date().toISOString(),
        source: 'favorites_export'
      }
    };

    // Écrire le fichier dans public/
    const filePath = path.join(process.cwd(), 'public', 'verified-channels.json');
    await fs.writeFile(filePath, JSON.stringify(verifiedData, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      channelsCount: enrichedChannels.length,
      filePath: '/verified-channels.json'
    });

  } catch (error) {
    console.error('Erreur génération fichier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du fichier' },
      { status: 500 }
    );
  }
}