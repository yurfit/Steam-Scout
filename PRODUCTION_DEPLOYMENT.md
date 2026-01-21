# Steam Scout - Production Deployment Guide

Complete guide for deploying Steam Scout to Vercel with enterprise-grade configuration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Clerk Authentication Setup](#clerk-authentication-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts

- [Vercel Account](https://vercel.com/signup) - For hosting
- [Clerk Account](https://clerk.com) - For authentication
- [Vercel Postgres](https://vercel.com/storage/postgres) or [Neon](https://neon.tech) - For database

### Required Tools

```bash
# Node.js 18+ (check version)
node --version  # Should be >= 18.0.0

# Vercel CLI (install globally)
npm install -g vercel

# Git (for version control)
git --version
```

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/yurfit/Steam-Scout.git
cd Steam-Scout
npm install
```

### 2. Environment Variables

Create `.env.local` for local development:

```bash
# Database (Vercel Postgres or Neon)
DATABASE_URL=postgresql://user:password@host:5432/database

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_[YOUR_LIVE_KEY_HERE]
VITE_CLERK_PUBLISHABLE_KEY=pk_live_[YOUR_LIVE_KEY_HERE]
CLERK_WEBHOOK_SECRET=whsec_[YOUR_WEBHOOK_SECRET_HERE]

# Application
NODE_ENV=production

# Optional: Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Database Configuration

### Option 1: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Create Database → Postgres
3. Copy the connection string
4. Add to Vercel environment variables

```bash
# Using Vercel CLI
vercel env add DATABASE_URL production
# Paste your connection string when prompted
```

### Option 2: Neon Postgres

1. Create account at [Neon](https://neon.tech)
2. Create a new project
3. Copy connection string
4. Add to Vercel environment variables

### Database Migration

```bash
# Push schema to database
npm run db:push

# Verify database connection
psql $DATABASE_URL -c "SELECT * FROM users LIMIT 1;"
```

## Clerk Authentication Setup

### 1. Create Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create new application
3. Choose authentication methods (Email, Google, etc.)

### 2. Configure Clerk Settings

**Application Settings:**
- Application Name: Steam Scout
- Allowed Origins: `https://steam-scout.vercel.app`, `http://localhost:5000`
- Session Token Template: Default

**OAuth Settings (if using):**
- Enable Google OAuth
- Add authorized redirect URIs

### 3. Get Clerk Keys

From Clerk Dashboard → API Keys:

```bash
# Development Keys
CLERK_SECRET_KEY=sk_test_[YOUR_TEST_KEY_HERE]
VITE_CLERK_PUBLISHABLE_KEY=pk_test_[YOUR_TEST_KEY_HERE]

# Production Keys (switch to production mode in Clerk)
CLERK_SECRET_KEY=sk_live_[YOUR_LIVE_KEY_HERE]
VITE_CLERK_PUBLISHABLE_KEY=pk_live_[YOUR_LIVE_KEY_HERE]
```

### 4. Configure Clerk Webhooks

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/clerk`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy webhook secret
5. Add to Vercel env: `CLERK_WEBHOOK_SECRET`

### 5. Test Clerk Integration

```bash
# Start dev server
npm run dev

# Visit http://localhost:5000/auth
# Test sign up and login
```

## Vercel Deployment

### Method 1: Vercel CLI (Recommended)

```bash
# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Deploy to production
vercel --prod
```

### Method 2: GitHub Integration

1. Push code to GitHub:
```bash
git remote add origin https://github.com/yurfit/Steam-Scout.git
git push -u origin main
```

2. Connect to Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Import Git Repository
   - Select `Steam-Scout`
   - Configure environment variables
   - Deploy

### Method 3: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Add New Project"
3. Import from Git or upload files
4. Configure build settings:
   - Framework Preset: Other
   - Build Command: `npm run build:vercel`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

### Configure Environment Variables in Vercel

```bash
# Using Vercel CLI
vercel env add DATABASE_URL production
vercel env add CLERK_SECRET_KEY production
vercel env add VITE_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_WEBHOOK_SECRET production
vercel env add NODE_ENV production

# Or via Vercel Dashboard:
# Project Settings → Environment Variables → Add
```

### Build Settings

**vercel.json** is already configured with:
- Rewrites for API routing
- Security headers
- CORS configuration
- Static asset caching

### Domain Configuration

1. Go to Project Settings → Domains
2. Add custom domain:
   - steam-scout.com
   - www.steam-scout.com
3. Configure DNS (Vercel provides instructions)
4. Wait for SSL certificate provisioning

## Post-Deployment Checklist

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-20T...",
  "uptime": 123.456,
  "environment": "production",
  "version": "1.0.0"
}

# Check readiness (includes DB)
curl https://your-domain.vercel.app/api/ready
```

### 2. Test Authentication

1. Visit `https://your-domain.vercel.app/auth`
2. Sign up with test account
3. Verify email redirect
4. Test login/logout
5. Check database for user record

### 3. Test Core Features

- [ ] Dashboard loads with Steam data
- [ ] Search functionality works
- [ ] Lead creation/editing works
- [ ] Rate limiting headers present
- [ ] Error boundary catches errors
- [ ] GDPR consent banner appears

### 4. Performance Testing

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=https://your-domain.vercel.app

# Load testing
npx loadtest -c 10 -n 100 https://your-domain.vercel.app/api/health
```

### 5. Security Audit

- [ ] HTTPS enforced
- [ ] Security headers present (X-Frame-Options, CSP, etc.)
- [ ] Rate limiting active
- [ ] No exposed secrets in client code
- [ ] Authentication required for protected routes
- [ ] CORS properly configured

## Monitoring & Analytics

### Vercel Analytics

Enable in Project Settings → Analytics

Features:
- Real user monitoring
- Web vitals tracking
- Geographic distribution
- Device breakdown

### Error Monitoring (Optional)

#### Option 1: Sentry

```bash
npm install @sentry/react @sentry/node

# Add to .env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

```typescript
// client/src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

#### Option 2: LogRocket

```bash
npm install logrocket logrocket-react

# Add to .env
VITE_LOGROCKET_ID=your-app-id
```

### Google Analytics (Already Integrated)

1. Create GA4 property
2. Get Measurement ID
3. Add to Vercel env:
```bash
vercel env add VITE_GA_MEASUREMENT_ID production
# Enter: G-XXXXXXXXXX
```

### Custom Analytics Dashboard

Built-in analytics endpoint at `/api/analytics` captures:
- Page views
- Events
- Errors
- User sessions

Query logs in Vercel:
```bash
vercel logs --prod --follow
```

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
DATABASE_URL=postgresql://localhost:5432/steamscout_dev
```

### Staging

```bash
NODE_ENV=production
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx  # Use test keys
CLERK_SECRET_KEY=sk_test_xxx
DATABASE_URL=postgresql://staging-host/steamscout_staging
```

### Production

```bash
NODE_ENV=production
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
DATABASE_URL=postgresql://production-host/steamscout_prod
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check Vercel logs
vercel logs --prod

# Common fixes:
# 1. Verify DATABASE_URL format
# 2. Check IP allowlist (Vercel IPs)
# 3. Ensure SSL mode (add ?sslmode=require)
```

### Clerk Authentication Errors

**Error: "Unauthorized" or "Invalid session"**

Solutions:
1. Verify `CLERK_SECRET_KEY` in Vercel matches Clerk dashboard
2. Check if using test keys in production (use live keys)
3. Verify allowed origins in Clerk includes your domain
4. Clear browser cookies and try again

**Error: "Webhook signature verification failed"**

Solutions:
1. Verify `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
2. Check webhook endpoint URL is correct
3. Ensure webhook is active in Clerk dashboard

### Build Failures

```bash
# Clear Vercel cache
vercel --prod --force

# Check build logs
vercel logs --build --prod

# Test build locally
npm run build:vercel
```

### Rate Limiting Issues

If legitimate users are being rate limited:

1. Check logs for excessive requests
2. Adjust limits in `server/middleware/rate-limiter.ts`
3. Consider implementing user-specific rate limits
4. Use Redis for distributed rate limiting

### Performance Issues

```bash
# Check bundle size
npm run build
npx vite-bundle-visualizer

# Analyze load times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.vercel.app

# Check database query performance
# Enable query logging in drizzle.config.ts
```

## Rollback Procedure

If deployment has critical issues:

```bash
# Via Vercel CLI
vercel rollback

# Or via Vercel Dashboard:
# Deployments → Previous deployment → Promote to Production
```

## Scaling Considerations

### Database Scaling

- **Vertical**: Upgrade Vercel Postgres tier
- **Horizontal**: Add read replicas for queries
- **Caching**: Implement Redis for frequently accessed data

### API Scaling

- Vercel automatically scales serverless functions
- Monitor function execution time (max 10s on hobby, 60s on pro)
- Consider edge functions for global distribution

### Rate Limiting

For high-traffic scenarios:
- Implement Redis-backed rate limiting
- Use Vercel Edge Config for distributed state
- Consider API gateway (e.g., Kong, Tyk)

## Security Best Practices

1. **Rotate secrets regularly**
   ```bash
   # Every 90 days
   vercel env rm CLERK_SECRET_KEY production
   vercel env add CLERK_SECRET_KEY production
   ```

2. **Enable Vercel protection**
   - Project Settings → Deployment Protection
   - Enable password protection for preview deployments

3. **Monitor for vulnerabilities**
   ```bash
   npm audit
   npm audit fix
   ```

4. **Keep dependencies updated**
   ```bash
   npm update
   npm outdated
   ```

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Clerk Documentation**: https://clerk.com/docs
- **Steam API**: https://steamcommunity.com/dev
- **GitHub Issues**: https://github.com/yurfit/Steam-Scout/issues

## Maintenance Schedule

### Daily
- Monitor error rates in Vercel logs
- Check API health endpoint
- Review rate limit violations

### Weekly
- Review analytics and usage patterns
- Check for dependency updates
- Verify backups are running

### Monthly
- Security audit (npm audit)
- Performance optimization review
- Cost analysis (Vercel/Clerk/DB usage)

### Quarterly
- Rotate secrets and API keys
- Review and update documentation
- Conduct disaster recovery test

---

**Deployment Version**: 1.0.0
**Last Updated**: January 2026
**Maintained By**: Steam Scout Team
