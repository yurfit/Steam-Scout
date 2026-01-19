import { db } from "./db";
import {
  leads,
  type Lead,
  type FullInsertLead,
  type UpdateLeadRequest
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { IAuthStorage, authStorage } from "./replit_integrations/auth";

export interface IStorage extends IAuthStorage {
  getLeads(userId: string): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: FullInsertLead): Promise<Lead>;
  updateLead(id: number, updates: UpdateLeadRequest): Promise<Lead>;
  deleteLead(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Delegate auth methods to the auth storage implementation
  getUser = authStorage.getUser.bind(authStorage);
  upsertUser = authStorage.upsertUser.bind(authStorage);

  async getLeads(userId: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.userId, userId));
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(lead: FullInsertLead): Promise<Lead> {
    const [created] = await db.insert(leads).values(lead).returning();
    return created;
  }

  async updateLead(id: number, updates: UpdateLeadRequest): Promise<Lead> {
    const [updated] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updated;
  }

  async deleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }
}

export const storage = new DatabaseStorage();
