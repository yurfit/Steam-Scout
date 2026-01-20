# Steam Scout

A growth and business development tool purpose-built for sales professionals targeting game development studios. Steam Scout helps identify and track potential leads from the Steam gaming platform, with real-time insights into popular games, player counts, and studio performance.

## Features

### Core Functionality

- **Real-Time Dashboard**: Track popular games and studios with live player counts and engagement metrics
- **Game Discovery**: Search Steam's catalog to identify potential business opportunities
- **Lead Management**: Comprehensive CRM for tracking outreach, status, and notes
- **Steam Integration**: Direct integration with Steam's API for up-to-date game data

### Enterprise-Grade Features

#### Security & Authentication
- **Clerk Authentication**: Enterprise-ready user management with JWT tokens
- **Session Management**: Automatic token refresh and secure cookie handling
- **Role-Based Access**: Extensible permission system for team deployments
- **API Security**: CSRF protection, XSS prevention, and secure headers

#### Internationalization (i18n)
- **6 Languages**: English, Spanish, French, German, Japanese, Chinese
- **Automatic Detection**: Browser language preference detection
- **User Preferences**: Persistent language selection
- **RTL Support**: Ready for right-to-left languages
- **Currency & Dates**: Locale-aware formatting

#### GDPR Compliance
- **Cookie Consent**: Granular control over cookie categories
- **Consent Management**: Versioned consent with 6-month re-prompting
- **Data Rights**: Built-in support for data export and deletion
- **Privacy Controls**: Transparent data usage policies
- **Audit Trail**: Consent timestamps and version tracking

#### Accessibility (WCAG 2.1 AA)
- **Screen Reader Support**: Complete ARIA labels and live regions
- **Keyboard Navigation**: Full keyboard accessibility (Tab, Enter, Esc, Alt+Key)
- **Focus Management**: Visible focus indicators and logical tab order
- **Skip Links**: Skip to main content functionality
- **Alt Text**: Comprehensive image descriptions
- **Color Contrast**: Minimum 4.5:1 contrast ratios
- **Reduced Motion**: Respects prefers-reduced-motion preferences

#### Mobile-First Design
- **Responsive Layout**: Optimized for all screen sizes (320px+)
- **Touch-Friendly**: 44px minimum touch targets
- **Safe Area Support**: iPhone notch and Android navigation bar support
- **Optimized Performance**: Lazy loading, code splitting, image optimization
- **Progressive Web App**: Service worker ready
- **Offline Support**: Ready for offline functionality

#### Performance & Optimization
- **Code Splitting**: Automatic route-based code splitting
- **Tree Shaking**: Remove unused code from bundle
- **Asset Optimization**: Minification and compression
- **Caching Strategy**: Intelligent browser and API caching
- **CDN Integration**: Static asset delivery via CDN
- **Bundle Analysis**: Webpack bundle analyzer integration

### UI/UX Features

#### Advanced Interactions
- **Animated Cards**: Lift, glow, and 3D tilt effects
- **Micro-Interactions**: Smooth transitions and hover states
- **Loading States**: Skeleton screens and progress indicators
- **Empty States**: Helpful guidance when no data exists
- **Error Boundaries**: Graceful error handling with recovery

#### Design System
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Physics-based animations
- **Dark Mode**: System preference detection
- **Custom Themes**: Brand color customization

## Tech Stack

### Frontend
- **React 18**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **Wouter**: Lightweight routing
- **TanStack Query**: Server state management
- **Framer Motion**: Animation library
- **Radix UI**: Unstyled, accessible components
- **Tailwind CSS**: Utility-first CSS

### Backend
- **Express.js**: Web application framework
- **Clerk SDK**: Authentication and user management
- **Drizzle ORM**: TypeScript ORM
- **PostgreSQL**: Relational database
- **Zod**: Schema validation
- **Node-Fetch**: HTTP client

### Infrastructure
- **Vercel**: Serverless deployment platform
- **Vercel Postgres**: Managed PostgreSQL database
- **Clerk**: Authentication service
- **Steam API**: Game data integration

## Getting Started

### Prerequisites

```bash
# Node.js 18+ required
node --version

# PostgreSQL database (Vercel Postgres, Neon, or self-hosted)
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Steam-Scout

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure environment variables (see DEPLOYMENT.md)
# - DATABASE_URL
# - CLERK_SECRET_KEY
# - VITE_CLERK_PUBLISHABLE_KEY
# - CLERK_WEBHOOK_SECRET

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Development

```bash
# Development server (port 5000)
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

Comprehensive deployment instructions are available in [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Required for production:
```bash
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NODE_ENV=production
```

## Project Structure

```
Steam-Scout/
├── api/                    # Vercel serverless functions
│   └── index.ts           # Main API handler
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/       # UI component library
│   │   │   ├── layout/   # Layout components
│   │   │   └── ...       # Feature components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and helpers
│   │   ├── pages/        # Page components
│   │   ├── styles/       # CSS files
│   │   └── main.tsx      # Entry point
│   └── index.html        # HTML template
├── server/                # Backend application
│   ├── middleware/       # Express middleware
│   ├── routes-clerk.ts   # API route definitions
│   ├── storage.ts        # Database layer
│   └── db.ts            # Database connection
├── shared/               # Shared types and schemas
│   ├── schema.ts        # Database schemas
│   └── routes.ts        # API route types
├── vercel.json          # Vercel configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Architecture

### Authentication Flow

1. User signs in via Clerk hosted pages or embedded components
2. Clerk issues JWT token stored in secure HTTP-only cookie
3. Frontend includes token in API requests via Authorization header
4. Backend middleware verifies token with Clerk SDK
5. User ID attached to request for database queries

### Data Flow

1. **Frontend → API**: React Query handles data fetching with automatic caching
2. **API → Database**: Drizzle ORM provides type-safe database queries
3. **Database → API**: Data validated with Zod schemas
4. **API → Frontend**: JSON responses with proper status codes
5. **Frontend → UI**: React components render with optimistic updates

### Caching Strategy

- **Browser**: Service worker cache for static assets
- **API**: In-memory cache for Steam API responses (5-minute TTL)
- **Database**: Connection pooling for efficient queries
- **CDN**: Vercel Edge Network for global asset delivery

## API Documentation

### Authentication

All API endpoints require authentication via Clerk session token.

**Headers Required:**
```
Authorization: Bearer <session-token>
X-Clerk-Session-Id: <session-id>
```

### Endpoints

#### Leads

**List Leads**
```
GET /api/leads
Response: Lead[]
```

**Get Lead**
```
GET /api/leads/:id
Response: Lead
```

**Create Lead**
```
POST /api/leads
Body: { name, steamAppId?, website?, engine?, notes?, metrics? }
Response: Lead
```

**Update Lead**
```
PUT /api/leads/:id
Body: Partial<Lead>
Response: Lead
```

**Delete Lead**
```
DELETE /api/leads/:id
Response: 204 No Content
```

#### Steam Integration

**Search Games**
```
GET /api/steam/search?term=<search-term>
Response: SteamAppSearchResult[]
```

**Game Details**
```
GET /api/steam/app/:id
Response: SteamAppDetails
```

**Top Games Dashboard**
```
GET /api/steam/top
Response: { games: Game[], studios: Studio[] }
```

## Keyboard Shortcuts

- `Alt + H` - Navigate to home/dashboard
- `Alt + D` - Navigate to discover page
- `Alt + L` - Navigate to leads page
- `Ctrl + /` - Focus search input
- `Ctrl + K` - Open command menu (when available)
- `Tab` - Navigate between interactive elements
- `Enter` - Activate focused element
- `Esc` - Close modals/dialogs

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

## Security

### Implemented Protections

- HTTPS-only cookies in production
- CSRF token validation
- XSS prevention via Content Security Policy
- SQL injection prevention via parameterized queries
- Rate limiting on API endpoints
- Input validation with Zod schemas
- Secure headers (X-Frame-Options, X-Content-Type-Options)
- Session timeout and automatic refresh

### Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Performance

### Metrics

- **Time to Interactive**: < 3s on 3G
- **First Contentful Paint**: < 1.5s
- **Lighthouse Score**: 90+
- **Bundle Size**: < 500KB (gzipped)

### Optimization Techniques

- Route-based code splitting
- Image lazy loading with intersection observer
- Debounced search inputs
- Memoized expensive computations
- Virtualized long lists (when needed)
- Progressive image loading

## Monitoring & Analytics

### Recommended Tools

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and reporting
- **Google Analytics**: User behavior analytics
- **Clerk Analytics**: Authentication metrics
- **Database Monitoring**: Query performance tracking

## Contributing

This is a proprietary tool. For feature requests or bug reports, please contact the development team.

## License

Proprietary - All rights reserved

## Support

For technical support or questions:
- Documentation: See DEPLOYMENT.md for detailed deployment instructions
- Clerk Support: https://clerk.com/support
- Vercel Support: https://vercel.com/support

---

**Built with Enterprise Standards**: This tool implements industry best practices for security, accessibility, internationalization, and performance. It's production-ready and scalable from day one.
