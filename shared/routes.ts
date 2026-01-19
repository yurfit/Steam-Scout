import { z } from 'zod';
import { insertLeadSchema, leads } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  leads: {
    list: {
      method: 'GET' as const,
      path: '/api/leads',
      responses: {
        200: z.array(z.custom<typeof leads.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/leads/:id',
      responses: {
        200: z.custom<typeof leads.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/leads',
      input: insertLeadSchema,
      responses: {
        201: z.custom<typeof leads.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/leads/:id',
      input: insertLeadSchema.partial(),
      responses: {
        200: z.custom<typeof leads.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/leads/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  steam: {
    search: {
      method: 'GET' as const,
      path: '/api/steam/search',
      input: z.object({ term: z.string() }),
      responses: {
        200: z.array(z.object({
          appid: z.number(),
          name: z.string(),
          logo: z.string(),
          icon: z.string(),
        })),
      },
    },
    details: {
      method: 'GET' as const,
      path: '/api/steam/app/:id',
      responses: {
        200: z.custom<any>(), // SteamAppDetails
        404: errorSchemas.notFound,
      },
    },
    topGames: {
      method: 'GET' as const,
      path: '/api/steam/top',
      responses: {
        200: z.object({
          games: z.array(z.object({
            appid: z.number(),
            name: z.string(),
            headerImage: z.string().optional(),
            developers: z.array(z.string()),
            publishers: z.array(z.string()),
            playerCount: z.number(),
            reviewScore: z.number().optional(),
            totalReviews: z.number().optional(),
            releaseDate: z.string().optional(),
            genres: z.array(z.string()).optional(),
          })),
          studios: z.array(z.object({
            name: z.string(),
            gamesCount: z.number(),
            totalPlayers: z.number(),
            topGame: z.string(),
          })),
        }),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
