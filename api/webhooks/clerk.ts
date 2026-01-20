import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Webhook } from 'svix';
import { getDb } from '../../server/db.vercel';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Clerk webhook handler for user lifecycle events
 * Syncs Clerk user data with our database
 *
 * Configure this webhook in Clerk Dashboard:
 * URL: https://yourdomain.com/api/webhooks/clerk
 * Events: user.created, user.updated, user.deleted
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return res.status(500).json({ message: 'Webhook not configured' });
  }

  try {
    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ message: 'Missing svix headers' });
    }

    const webhook = new Webhook(webhookSecret);
    const body = JSON.stringify(req.body);

    const event = webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as any;

    const db = getDb();

    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = event.data;

        await db
          .insert(users)
          .values({
            id,
            email: email_addresses[0]?.email_address || '',
            firstName: first_name || null,
            lastName: last_name || null,
            profileImageUrl: image_url || null,
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              email: email_addresses[0]?.email_address || '',
              firstName: first_name || null,
              lastName: last_name || null,
              profileImageUrl: image_url || null,
            },
          });

        break;
      }

      case 'user.deleted': {
        const { id } = event.data;

        // Soft delete or hard delete based on your data retention policy
        await db.delete(users).where(eq(users.id, id));

        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({
      message: 'Webhook verification failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
