import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth';
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

    const term = req.query.term as string;

    if (!term) {
      return res.status(400).json({ message: 'Search term required' });
    }

    // Unofficial Store Search API
    const response = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`
    );

    const data: any = await response.json();

    const results = data.items?.map((item: any) => ({
      appid: item.id,
      name: item.name,
      logo: item.tiny_image,
      icon: item.tiny_image
    })) || [];

    return res.status(200).json(results);
  } catch (error) {
    console.error('Steam search error:', error);
    return res.status(500).json({
      message: 'Failed to fetch from Steam',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
