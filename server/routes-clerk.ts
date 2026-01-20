import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { requireAuth } from "./middleware/clerk-auth";
import fetch from "node-fetch";
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth Routes - Get current user from Clerk
  app.get('/api/auth/user', requireAuth, async (req, res) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const clerkUser = await clerkClient.users.getUser(req.auth.userId);

      // Sync with local database
      const user = await storage.upsertUser({
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImageUrl: clerkUser.imageUrl,
      });

      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Webhook endpoint for Clerk user events
  app.post('/api/webhooks/clerk', async (req, res) => {
    try {
      const { type, data } = req.body;

      switch (type) {
        case 'user.created':
        case 'user.updated':
          await storage.upsertUser({
            id: data.id,
            email: data.email_addresses[0]?.email_address,
            firstName: data.first_name,
            lastName: data.last_name,
            profileImageUrl: data.image_url,
          });
          break;

        case 'user.deleted':
          // Handle user deletion if needed
          break;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Leads Routes - Protected with Clerk
  app.get(api.leads.list.path, requireAuth, async (req, res) => {
    try {
      const userId = req.auth!.userId;
      const leads = await storage.getLeads(userId);
      res.json(leads);
    } catch (error) {
      console.error('Get leads error:', error);
      res.status(500).json({ message: 'Failed to fetch leads' });
    }
  });

  app.get(api.leads.get.path, requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(Number(req.params.id));
      if (!lead) return res.status(404).json({ message: 'Lead not found' });

      // Verify ownership
      if (lead.userId !== req.auth!.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      res.json(lead);
    } catch (error) {
      console.error('Get lead error:', error);
      res.status(500).json({ message: 'Failed to fetch lead' });
    }
  });

  app.post(api.leads.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.leads.create.input.parse(req.body);
      const userId = req.auth!.userId;
      const lead = await storage.createLead({ ...input, userId });
      res.status(201).json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Create lead error:', err);
      res.status(500).json({ message: 'Failed to create lead' });
    }
  });

  app.put(api.leads.update.path, requireAuth, async (req, res) => {
    try {
      const leadId = Number(req.params.id);
      const existingLead = await storage.getLead(leadId);

      if (!existingLead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Verify ownership
      if (existingLead.userId !== req.auth!.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const input = api.leads.update.input.parse(req.body);
      const lead = await storage.updateLead(leadId, input);
      res.json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Update lead error:', err);
      res.status(500).json({ message: 'Failed to update lead' });
    }
  });

  app.delete(api.leads.delete.path, requireAuth, async (req, res) => {
    try {
      const leadId = Number(req.params.id);
      const existingLead = await storage.getLead(leadId);

      if (!existingLead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Verify ownership
      if (existingLead.userId !== req.auth!.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await storage.deleteLead(leadId);
      res.status(204).send();
    } catch (error) {
      console.error('Delete lead error:', error);
      res.status(500).json({ message: 'Failed to delete lead' });
    }
  });

  // Steam Proxy Routes with rate limiting awareness
  const STEAM_CACHE = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function getCached(key: string): any | null {
    const cached = STEAM_CACHE.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  function setCache(key: string, data: any): void {
    STEAM_CACHE.set(key, { data, timestamp: Date.now() });
  }

  app.get(api.steam.search.path, requireAuth, async (req, res) => {
    try {
      const term = req.query.term as string;
      if (!term) return res.status(400).json({ message: "Search term required" });

      const cacheKey = `search:${term}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);

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

      setCache(cacheKey, results);
      res.json(results);
    } catch (error) {
      console.error("Steam search error:", error);
      res.status(500).json({ message: "Failed to fetch from Steam" });
    }
  });

  app.get(api.steam.details.path, requireAuth, async (req, res) => {
    try {
      const appId = req.params.id;

      const cacheKey = `details:${appId}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);

      const detailsResponse = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appId}`
      );
      const detailsData: any = await detailsResponse.json();

      if (!detailsData[appId]?.success) {
        return res.status(404).json({ message: "App not found on Steam" });
      }

      const appData = detailsData[appId].data;

      let playerCount = 0;
      try {
        const statsResponse = await fetch(
          `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`
        );
        const statsData: any = await statsResponse.json();
        playerCount = statsData.response?.player_count || 0;
      } catch (e) {
        console.warn("Failed to fetch player stats", e);
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

      setCache(cacheKey, result);
      res.json(result);
    } catch (error) {
      console.error("Steam details error:", error);
      res.status(500).json({ message: "Failed to fetch app details" });
    }
  });

  // Top Games Dashboard
  const TOP_GAME_IDS = [
    730, 570, 440, 1172470, 578080, 1599340, 252490, 271590,
    1245620, 892970, 1091500, 814380, 1174180, 359550,
    413150, 367520, 391540, 1086940, 105600, 945360
  ];

  app.get(api.steam.topGames.path, requireAuth, async (req, res) => {
    try {
      const cacheKey = 'top-games';
      const cached = getCached(cacheKey);
      if (cached) return res.json(cached);

      const gamePromises = TOP_GAME_IDS.map(async (appId) => {
        try {
          const detailsResponse = await fetch(
            `https://store.steampowered.com/api/appdetails?appids=${appId}`
          );
          const detailsData: any = await detailsResponse.json();

          if (!detailsData[appId]?.success) return null;

          const appData = detailsData[appId].data;
          let playerCount = 0;

          try {
            const statsResponse = await fetch(
              `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`
            );
            const statsData: any = await statsResponse.json();
            playerCount = statsData.response?.player_count || 0;
          } catch (e) {
            // Ignore errors
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
          return null;
        }
      });

      const results = await Promise.all(gamePromises);
      const games = results
        .filter((g): g is NonNullable<typeof g> => g !== null)
        .sort((a, b) => b.playerCount - a.playerCount);

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

      const response = { games, studios };
      setCache(cacheKey, response);
      res.json(response);
    } catch (error) {
      console.error("Top games error:", error);
      res.status(500).json({ message: "Failed to fetch top games" });
    }
  });

  return httpServer;
}
