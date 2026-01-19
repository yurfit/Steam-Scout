import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import fetch from "node-fetch";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Leads Routes - Protected
  app.get(api.leads.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const leads = await storage.getLeads(userId);
    res.json(leads);
  });

  app.get(api.leads.get.path, isAuthenticated, async (req, res) => {
    const lead = await storage.getLead(Number(req.params.id));
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  });

  app.post(api.leads.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.leads.create.input.parse(req.body);
      const lead = await storage.createLead(input);
      res.status(201).json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.leads.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.leads.update.input.parse(req.body);
      const lead = await storage.updateLead(Number(req.params.id), input);
      if (!lead) return res.status(404).json({ message: 'Lead not found' });
      res.json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.leads.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteLead(Number(req.params.id));
    res.status(204).send();
  });

  // Steam Proxy Routes
  app.get(api.steam.search.path, isAuthenticated, async (req, res) => {
    try {
      const term = req.query.term as string;
      if (!term) return res.status(400).json({ message: "Search term required" });
      
      // Unofficial Store Search API
      const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`);
      const data: any = await response.json();
      
      const results = data.items?.map((item: any) => ({
        appid: item.id,
        name: item.name,
        logo: item.tiny_image, // Steam provides different image sizes
        icon: item.tiny_image
      })) || [];

      res.json(results);
    } catch (error) {
      console.error("Steam search error:", error);
      res.status(500).json({ message: "Failed to fetch from Steam" });
    }
  });

  app.get(api.steam.details.path, isAuthenticated, async (req, res) => {
    try {
      const appId = req.params.id;
      
      // Fetch App Details
      const detailsResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
      const detailsData: any = await detailsResponse.json();
      
      if (!detailsData[appId]?.success) {
        return res.status(404).json({ message: "App not found on Steam" });
      }

      const appData = detailsData[appId].data;

      // Fetch Player Count (optional, can fail gracefully)
      let playerCount = 0;
      try {
        // Use user headers to mimic browser if needed, but API is publicish
        const statsResponse = await fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`);
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
          review_score: appData.metacritic?.score, // Using metacritic as proxy if available
          total_reviews: appData.recommendations?.total
        }
      };

      res.json(result);
    } catch (error) {
      console.error("Steam details error:", error);
      res.status(500).json({ message: "Failed to fetch app details" });
    }
  });

  // Top Games Dashboard - Curated list of popular games
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

  app.get(api.steam.topGames.path, isAuthenticated, async (req, res) => {
    try {
      const gamePromises = TOP_GAME_IDS.map(async (appId) => {
        try {
          // Fetch App Details
          const detailsResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
          const detailsData: any = await detailsResponse.json();
          
          if (!detailsData[appId]?.success) {
            return null;
          }

          const appData = detailsData[appId].data;

          // Fetch Player Count
          let playerCount = 0;
          try {
            const statsResponse = await fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`);
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
          return null;
        }
      });

      const results = await Promise.all(gamePromises);
      const games = results
        .filter((g): g is NonNullable<typeof g> => g !== null)
        .sort((a, b) => b.playerCount - a.playerCount);

      // Aggregate studios from developers
      const studioMap = new Map<string, { totalPlayers: number; games: string[]; topPlayerCount: number; topGame: string }>();
      
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

      res.json({ games, studios });
    } catch (error) {
      console.error("Top games error:", error);
      res.status(500).json({ message: "Failed to fetch top games" });
    }
  });

  return httpServer;
}
