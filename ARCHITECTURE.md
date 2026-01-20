# Steam Scout Architecture - Vercel Edition

## System Overview

Steam Scout is a serverless SaaS platform for B2B game studio lead management, built on Vercel's edge infrastructure with Clerk authentication and PostgreSQL database.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 18 + TypeScript + Wouter + TanStack Query        │  │
│  │  shadcn/ui + Tailwind CSS + Framer Motion              │  │
│  │  Clerk React Components                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Static Assets (CDN)                                      │  │
│  │  • HTML, CSS, JS bundles                                  │  │
│  │  • Images, fonts                                          │  │
│  │  • Global edge caching                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Serverless Functions Layer                      │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │  API Routes         │  │  Authentication (Clerk)          │ │
│  │  • /api/leads       │  │  • JWT verification              │ │
│  │  • /api/steam       │  │  • Session management            │ │
│  │  • /api/webhooks    │  │  • User lifecycle sync           │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌────────────────────┐   ┌──────────────────────────────────┐ │
│  │  PostgreSQL        │   │  External APIs                   │ │
│  │  • Users           │   │  • Steam Web API                 │ │
│  │  • Leads           │   │  • Steam Store API               │ │
│  │  • Serverless pool │   │  • Steam Stats API               │ │
│  └────────────────────┘   └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Architecture

```
client/src/
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   └── layout/
│       └── Sidebar.tsx        # Navigation sidebar with collapse state
│
├── pages/
│   ├── Dashboard.tsx          # Top games and studios analytics
│   ├── Discover.tsx           # Steam game search and discovery
│   ├── MyLeads.tsx            # Lead pipeline management (Kanban)
│   └── AuthPage.tsx           # Clerk authentication UI
│
├── hooks/
│   ├── use-auth.ts            # Clerk authentication hook
│   ├── use-leads.ts           # Lead CRUD operations
│   └── use-steam.ts           # Steam API integration
│
├── lib/
│   ├── queryClient.ts         # TanStack Query configuration
│   └── utils.ts               # Utility functions (cn, etc.)
│
├── App.tsx                    # Root component with providers
└── main.tsx                   # Entry point with Clerk provider
```

### Backend Architecture

```
api/
├── leads/
│   ├── index.ts               # List/create leads
│   └── [id].ts                # Get/update/delete lead
│
├── steam/
│   ├── search.ts              # Search games
│   ├── details/
│   │   └── [id].ts            # Game details + metrics
│   └── top-games.ts           # Dashboard data (cached)
│
└── webhooks/
    └── clerk.ts               # User lifecycle sync

server/
├── db.vercel.ts               # Serverless database connection
└── storage.ts                 # Database operations (Drizzle ORM)

shared/
├── schema.ts                  # Database schema definitions
├── routes.ts                  # API route contracts
└── models/
    └── auth.ts                # User model
```

## Data Flow

### Authentication Flow

```
1. User visits app
   ↓
2. ClerkProvider initializes
   ↓
3. Check JWT token in cookies
   ↓
4. If valid: Load user session
   If invalid: Redirect to /auth
   ↓
5. User signs in via Clerk
   ↓
6. Clerk issues JWT token
   ↓
7. Token stored in secure cookie
   ↓
8. Redirect to dashboard
   ↓
9. API calls include JWT in Authorization header
   ↓
10. Vercel function validates JWT with Clerk
    ↓
11. Extract userId from JWT claims
    ↓
12. Query database with userId
    ↓
13. Return user-specific data
```

### Lead Management Flow

```
1. User searches for game in Discover page
   ↓
2. Frontend calls /api/steam/search?term=...
   ↓
3. Serverless function validates JWT
   ↓
4. Proxy request to Steam Store API
   ↓
5. Return search results
   ↓
6. User selects game, fills lead form
   ↓
7. Frontend calls POST /api/leads
   ↓
8. Serverless function validates JWT
   ↓
9. Extract userId from JWT
   ↓
10. Insert lead into database with userId
    ↓
11. Return created lead
    ↓
12. Frontend updates local cache (TanStack Query)
    ↓
13. User sees new lead in MyLeads page
```

### Dashboard Data Flow

```
1. User visits Dashboard page
   ↓
2. Frontend calls /api/steam/top-games
   ↓
3. Serverless function validates JWT
   ↓
4. Check edge cache (5-minute TTL)
   ↓
5. If cached: Return immediately
   If not cached: Fetch from Steam APIs
   ↓
6. Parallel requests for 20 top game IDs
   ↓
7. Fetch details + player counts
   ↓
8. Aggregate studio statistics
   ↓
9. Sort by player count
   ↓
10. Cache result at edge
    ↓
11. Return { games, studios }
    ↓
12. Frontend renders charts and tables
```

## Database Schema

### Users Table
```typescript
users {
  id: varchar (Clerk user ID)
  email: varchar
  firstName: varchar?
  lastName: varchar?
  profileImageUrl: varchar?
}
```

### Leads Table
```typescript
leads {
  id: serial (primary key)
  userId: varchar (foreign key → users.id)
  name: text
  steamAppId: text?
  website: text?
  status: text ("new" | "contacted" | "interested" | "closed")
  engine: text?
  notes: text?
  metrics: jsonb?
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Authentication Architecture

### Clerk Integration

**Client-Side**:
- ClerkProvider wraps entire app
- useUser() hook for user state
- SignIn/SignUp components for UI
- Automatic JWT management

**Server-Side**:
- getAuth(req) extracts JWT from request
- Validates token signature with Clerk
- Returns userId and session claims
- No session storage required (stateless)

**Webhook Sync**:
- Clerk sends events: user.created, user.updated, user.deleted
- Vercel function verifies signature with svix
- Syncs user data to PostgreSQL
- Maintains local user records

### Security Model

**Authentication**: JWT tokens issued by Clerk
**Authorization**: userId extracted from JWT, used in database queries
**Data Isolation**: All queries filtered by userId
**Session Lifetime**: 7 days (configurable in Clerk)
**Token Refresh**: Automatic via Clerk SDK

## Serverless Architecture

### Function Characteristics

**Runtime**: Node.js 20.x
**Timeout**: 10 seconds (Hobby), 60 seconds (Pro)
**Memory**: 1024MB default
**Concurrency**: Auto-scaling, up to 1000 concurrent invocations
**Cold Start**: ~200-500ms (first request after idle)
**Warm Response**: ~50-150ms

### Connection Pooling Strategy

```typescript
// Serverless-optimized connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,                      // Critical: Limit to 1 connection per instance
  idleTimeoutMillis: 30000,    // Close idle connections
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,       // Allow process to exit when idle
});
```

**Why max: 1?**
- Each function invocation is a separate process
- Multiple connections per function waste resources
- Vercel auto-scales by creating more function instances
- Database connection limits are per-instance, not global

### Caching Strategy

**Edge Caching**:
```typescript
res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
```

**Applied to**:
- `/api/steam/top-games`: 5-minute cache, 10-minute stale-while-revalidate
- Static assets: Permanent cache with versioned URLs

**Not cached**:
- User-specific data (leads)
- Authentication endpoints
- Webhook endpoints

## External Dependencies

### Steam Web API

**Endpoints Used**:
1. Store Search API: `https://store.steampowered.com/api/storesearch/`
   - Purpose: Game search
   - Rate Limit: Lenient (no official limit)
   - Authentication: None required

2. App Details API: `https://store.steampowered.com/api/appdetails`
   - Purpose: Game metadata
   - Rate Limit: ~200 requests per 5 minutes (unofficial)
   - Authentication: None required

3. Player Stats API: `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/`
   - Purpose: Current player count
   - Rate Limit: 100,000 calls/day (requires API key for higher limits)
   - Authentication: Optional (public endpoint)

**Error Handling**:
- Retry with exponential backoff
- Graceful degradation (return partial data)
- Fallback to cached data

### Clerk API

**Purpose**: Authentication provider
**Endpoints**:
- User management
- Session verification
- Webhook delivery

**Rate Limits**:
- Free: 10,000 MAU
- Pro: 100,000 MAU
- API calls: No documented limits

## Performance Characteristics

### Page Load Times

**First Load (Cold Start)**:
- HTML: 50-100ms (edge cache)
- JS Bundle: 200-400ms (vendor + app code)
- API Call: 300-600ms (includes cold start)
- **Total**: ~1-1.5 seconds

**Subsequent Loads**:
- HTML: 20-50ms (edge cache)
- JS Bundle: Cached (0ms)
- API Call: 50-150ms (warm function)
- **Total**: ~100-300ms

### Database Query Performance

**Typical Query Times**:
- List leads: 20-50ms
- Get single lead: 10-30ms
- Create lead: 30-60ms
- Update lead: 30-60ms

**Optimizations**:
- Indexed on userId
- Indexed on steamAppId
- BTREE indexes for fast lookups

### API Response Times

**Target Latencies** (p95):
- GET /api/leads: <200ms
- POST /api/leads: <300ms
- GET /api/steam/search: <500ms
- GET /api/steam/details/:id: <800ms
- GET /api/steam/top-games: <200ms (cached) / <5000ms (uncached)

## Scaling Characteristics

### Horizontal Scaling

**Automatic**: Vercel auto-scales serverless functions
**Limits**:
- Hobby: 100 concurrent executions
- Pro: 1000 concurrent executions
- Enterprise: Custom limits

### Database Scaling

**Connection Limits**:
- Each function instance uses 1 connection
- Total connections = active function instances
- Database must support concurrent connections

**Strategies**:
1. Connection pooling (implemented)
2. Read replicas for read-heavy workloads
3. Caching layer (Redis/KV) for frequent queries
4. Database proxy (PgBouncer) for connection management

### Bottlenecks

**Current**:
1. Steam API rate limits (200 req/5min per IP)
2. Database connection limits (depends on tier)
3. Function timeout (10s on Hobby tier)

**Mitigation**:
1. Edge caching for Steam data
2. Database connection pooling
3. Upgrade to Pro tier (60s timeout)

## Monitoring and Observability

### Vercel Analytics

**Metrics Tracked**:
- Page views
- Web Vitals (LCP, FID, CLS)
- Function execution times
- Function error rates
- Bandwidth usage

**Access**: Vercel Dashboard → Analytics

### Clerk Analytics

**Metrics Tracked**:
- Sign-ups
- Sign-ins
- Active users
- Session duration
- Authentication method usage

**Access**: Clerk Dashboard → Analytics

### Custom Logging

**Function Logs**:
```typescript
console.log('Request:', req.method, req.url);
console.error('Error:', error);
```

**Accessed via**: Vercel Dashboard → Functions → Logs

**Retention**:
- Hobby: 1 day
- Pro: 7 days

## Disaster Recovery

### Backup Strategy

**Database**:
- Automated daily backups (Vercel Postgres)
- Point-in-time recovery (last 7 days)
- Manual export via pg_dump

**Code**:
- Git repository (GitHub/GitLab)
- Vercel deployment history (last 100 deployments)
- Rollback via Vercel dashboard

### Rollback Procedures

**Application Rollback**:
1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Select previous working deployment
4. Click "Promote to Production"
5. Immediate rollback (< 1 minute)

**Database Rollback**:
1. Point-in-time recovery (if within 7 days)
2. Or restore from backup snapshot
3. Update DATABASE_URL in Vercel
4. Redeploy application

### Failure Scenarios

**Scenario**: Clerk service outage
**Impact**: Users cannot authenticate
**Mitigation**: None (third-party dependency)
**Recovery**: Wait for Clerk to restore service

**Scenario**: Database connection failure
**Impact**: API returns 500 errors
**Mitigation**: Retry logic, exponential backoff
**Recovery**: Fix database connection string

**Scenario**: Steam API outage
**Impact**: Search/details unavailable
**Mitigation**: Return cached data, graceful error messages
**Recovery**: Wait for Steam to restore service

**Scenario**: Vercel platform outage
**Impact**: Application unavailable
**Mitigation**: None (platform dependency)
**Recovery**: Wait for Vercel to restore service

## Cost Model

### Estimated Monthly Costs

**Small Scale** (100 users, 10k requests/month):
- Vercel Hobby: $0
- Clerk Free: $0
- Database (external): $0 (Supabase free tier)
- **Total**: $0/month

**Medium Scale** (1000 users, 100k requests/month):
- Vercel Pro: $20
- Clerk Pro: $25
- Vercel Postgres: $20
- **Total**: $65/month

**Large Scale** (10k users, 1M requests/month):
- Vercel Pro: $20 + $40 (bandwidth)
- Clerk Pro: $25 + $0.02/MAU over 5k
- Database: $50 (upgraded tier)
- **Total**: ~$235/month

### Cost Optimization

1. **Enable edge caching** for expensive Steam API calls
2. **Implement request batching** to reduce function invocations
3. **Use database indexes** to speed up queries
4. **Optimize bundle size** to reduce bandwidth costs
5. **Add rate limiting** to prevent abuse
6. **Monitor usage** and set up billing alerts

## Security Architecture

### Threat Model

**Threats Mitigated**:
1. ✅ Unauthorized access → Clerk JWT validation
2. ✅ SQL injection → Drizzle ORM parameterized queries
3. ✅ XSS → React automatic escaping
4. ✅ CSRF → Clerk session tokens (SameSite cookies)
5. ✅ Man-in-the-middle → HTTPS enforced by Vercel
6. ✅ Data leakage → User data isolated by userId

**Threats Not Mitigated**:
1. ⚠️ DDoS → No rate limiting implemented yet
2. ⚠️ API abuse → No request quotas
3. ⚠️ Credential stuffing → Rely on Clerk's protection

### Security Best Practices

**Implemented**:
- HTTPS everywhere (Vercel enforced)
- Secure cookie flags (httpOnly, secure, sameSite)
- JWT validation on all API routes
- Database connection over SSL
- Environment variables for secrets
- Webhook signature verification

**Recommended**:
- Implement rate limiting (e.g., Upstash Rate Limit)
- Add request logging for audit trail
- Enable Vercel firewall rules
- Set up security monitoring (e.g., Sentry)
- Regular dependency updates
- Penetration testing for production

---

This architecture is designed for production-grade performance, scalability, and maintainability while keeping costs low for early-stage deployment. As usage grows, the serverless model allows seamless scaling without infrastructure management.
