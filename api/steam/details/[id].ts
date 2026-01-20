import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../../_lib/auth';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await requireAuth(req);

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const appId = req.query.id as string;

    // Fetch App Details
    const detailsResponse = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}`
    );
    const detailsData: any = await detailsResponse.json();

    if (!detailsData[appId]?.success) {
      return res.status(404).json({ message: 'App not found on Steam' });
    }

    const appData = detailsData[appId].data;

    // Fetch Player Count (optional, can fail gracefully)
    let playerCount = 0;
    try {
      const statsResponse = await fetch(
        `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`
      );
      const statsData: any = await statsResponse.json();
      playerCount = statsData.response?.player_count || 0;
    } catch (e) {
      console.warn('Failed to fetch player stats', e);
    }

    const result = {
      steam_appid: appData.steam_appid,
      name: appData.name,
      short_description: appData.short_description,
      header_image: appData.header_image,
      website: appData.website,
      developers: appData.developers || [],
      publishers: appData.publishers || [],
      price_overview: appData.price_overview,
      genres: appData.genres,
      release_date: appData.release_date,
      metrics: {
        player_count: playerCount,
        review_score: appData.metacritic?.score,
        total_reviews: appData.recommendations?.total
      }
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Steam details error:', error);
    return res.status(500).json({
      message: 'Failed to fetch app details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
