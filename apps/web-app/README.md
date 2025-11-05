# Nugget Web App

This is the main web application for Nugget, the complete parenting journey companion. Built with Next.js 15 and the App Router for a fast, responsive, and SEO-friendly experience.

## Features

- **Next.js 15** with App Router for optimal performance
- **React 19** with latest features and improvements
- **TypeScript** for type safety throughout
- **Tailwind CSS** for beautiful, responsive design
- **shadcn/ui** components for consistent UI
- **tRPC** for type-safe API calls
- **Clerk** for secure authentication
- **Supabase** for database and real-time features
- **PostHog** for analytics and user insights

## Parenting Journey Features

### Trying to Conceive
- Cycle tracking dashboard
- Ovulation predictions
- Fertility insights and charts

### Pregnancy Tracking
- Week-by-week development updates
- Symptom and weight tracking
- Photo diary

### Baby Care
- Feeding, sleep, and diaper logs
- Growth charts
- Healthcare provider reports

### Milestone Tracking
- Developmental milestone checklist
- Photo and video memories
- Shareable milestone cards

## Development

```bash
# Start the development server
bun dev:next

# Or from the web-app directory
cd apps/web-app
bun dev
```

The app will be available at `http://localhost:3000`

## Building

```bash
# Build for production
bun build

# Start production server
bun start
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Deployment

Deploy to Vercel with one command:

```bash
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments on push.

## Project Structure

```
apps/web-app/
├── src/
│   ├── app/
│   │   ├── (marketing)/     # Public marketing pages
│   │   ├── (app)/           # Authenticated app pages
│   │   └── api/             # API routes
│   ├── components/          # Shared components
│   ├── lib/                 # Utility functions
│   └── middleware.ts        # Next.js middleware
├── public/                  # Static assets
└── package.json
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Clerk Authentication](https://clerk.com/docs)
- [Nugget Documentation](https://docs.nugget.baby)
