import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  steamAppId: text("steam_app_id"), 
  website: text("website"),
  status: text("status").notNull().default("new"), // new, contacted, interested, closed
  engine: text("engine").default("Unknown"),
  notes: text("notes"),
  metrics: jsonb("metrics"), // { followers, reviews, ccu, estimatedRevenue }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true, userId: true });
export const fullInsertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type FullInsertLead = z.infer<typeof fullInsertLeadSchema>;

export type CreateLeadRequest = InsertLead;
export type UpdateLeadRequest = Partial<InsertLead>;

// Steam API Types
export interface SteamAppSearchResult {
  appid: number;
  name: string;
  logo: string;
  icon: string;
}

export interface SteamAppDetails {
  steam_appid: number;
  name: string;
  short_description: string;
  header_image: string;
  website: string;
  developers: string[];
  publishers: string[];
  price_overview?: {
    final_formatted: string;
  };
  genres?: { description: string }[];
  release_date?: { date: string };
  metrics?: {
    player_count?: number;
    review_score?: number; // 0-10 (proxy)
    total_reviews?: number;
  }
}
