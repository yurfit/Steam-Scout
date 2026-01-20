import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth';
import fetch from 'node-fetch';

const TOP_GAME_IDS = [
  730,      // Counter-Strike 2
  570,      // Dota 2
  440,      // Team Fortress 2
  1172470,  // Apex Legends
  578080,   // PUBG
  1599340,  // Lost Ark
  252490,   // Rust
  271590,   // GTA V
  1245620,  // Elden Ring
  892970,   // Valheim
  1091500,  // Cyberpunk 2077
  814380,   // Sekiro
  1174180,  // Red Dead Redemption 2
  359550,   // Rainbow Six Siege
  413150,   // Stardew Valley
  367520,   // Hollow Knight
  391540,   // Undertale
  1086940,  // Baldur's Gate 3
  105600,   // Terraria
  945360,   // Among Us
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // Cache for 5 minutes
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await requireAuth(req);

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const gamePromises = TOP_GAME_IDS.map(async (appId) => {
      try {
        // Fetch App Details
        const detailsResponse = await fetch(
          `https://store.steampowered.com/api/appdetails?appids=${appId}`
        );
        const detailsData: any = await detailsResponse.json();

        if (!detailsData[appId]?.success) {
          return null;
        }

        const appData = detailsData[appId].data;

        // Fetch Player Count
        let playerCount = 0;
        try {
          const statsResponse = await fetch(
            `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`
          );
          const statsData: any = await statsResponse.json();
          playerCount = statsData.response?.player_count || 0;
        } catch (e) {
          // Ignore player count errors
        }

        return {
          appid: appData.steam_appid,
          name: appData.name,
          headerImage: appData.header_image,
          developers: appData.developers || [],
          publishers: appData.publishers || [],
          playerCount,
          reviewScore: appData.metacritic?.score,
          totalReviews: appData.recommendations?.total,
          releaseDate: appData.release_date?.date,
          genres: appData.genres?.map((g: any) => g.description) || [],
        };
      } catch (e) {
        console.error(`Failed to fetch game ${appId}:`, e);
        return null;
      }
    });

    const results = await Promise.all(gamePromises);
    const games = results
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .sort((a, b) => b.playerCount - a.playerCount);

    // Aggregate studios from developers
    const studioMap = new Map<string, {
      totalPlayers: number;
      games: string[];
      topPlayerCount: number;
      topGame: string
    }>();

    for (const game of games) {
      for (const dev of game.developers) {
        const existing = studioMap.get(dev);
        if (existing) {
          existing.totalPlayers += game.playerCount;
          existing.games.push(game.name);
          if (game.playerCount > existing.topPlayerCount) {
            existing.topPlayerCount = game.playerCount;
            existing.topGame = game.name;
          }
        } else {
          studioMap.set(dev, {
            totalPlayers: game.playerCount,
            games: [game.name],
            topPlayerCount: game.playerCount,
            topGame: game.name,
          });
        }
      }
    }

    const studios = Array.from(studioMap.entries())
      .map(([name, data]) => ({
        name,
        gamesCount: data.games.length,
        totalPlayers: data.totalPlayers,
        topGame: data.topGame,
      }))
      .sort((a, b) => b.totalPlayers - a.totalPlayers);

    return res.status(200).json({ games, studios });
  } catch (error) {
    console.error('Top games error:', error);
    return res.status(500).json({
      message: 'Failed to fetch top games',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
