import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userId = await requireAuth(req);

    const leadId = parseInt(req.query.id as string, 10);

    if (isNaN(leadId)) {
      return res.status(400).json({ message: 'Invalid lead ID' });
    }

    if (req.method === 'GET') {
      const lead = await storage.getLead(leadId);

      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Verify ownership
      if (lead.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      return res.status(200).json(lead);
    }

    if (req.method === 'PUT') {
      const lead = await storage.getLead(leadId);

      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      if (lead.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const updated = await storage.updateLead(leadId, req.body);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const lead = await storage.getLead(leadId);

      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      if (lead.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await storage.deleteLead(leadId);
      return res.status(204).end();
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Lead API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
