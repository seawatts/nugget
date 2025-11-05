# Nugget - Your Complete Parenting Journey

> A comprehensive parenting companion app supporting you from conception to milestones

## Why Nugget?

### 🍼 Complete Journey Support
- **Trying to Conceive**: Track your cycle, ovulation, and fertility indicators
- **Pregnancy**: Week-by-week tracking with developmental milestones and preparation checklists
- **Baby Care**: Log feeding, sleep, diapers, and growth metrics
- **Milestones**: Celebrate and track developmental achievements with photos and memories

### 🚀 Modern Tech Stack
- **Cross-Platform**: Web app, iOS, and Android with seamless data sync
- **Privacy-First**: End-to-end encryption with HIPAA-compliant options
- **Real-Time Sync**: Your data stays current across all devices
- **Offline Support**: Track activities even without internet connection

## Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/seawatts/nugget my-parenting-app
cd my-parenting-app
bun install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Configure your environment variables
bun with-env -- bun db:push
```

### 3. Start Development
```bash
# Start all apps
bun dev

# Or start specific apps
bun dev:next          # Web app only
```

## Architecture Overview

### Apps
- **Web App** (`apps/web-app`): Next.js 15 with App Router - responsive web experience
- **Mobile** (`apps/expo`): React Native with Expo SDK 51 - iOS and Android apps
- **iOS** (`apps/ios`): Native iOS app with widgets and Apple Health integration

### Core Packages
- **API** (`packages/api`): tRPC v11 router with end-to-end type safety
- **Database** (`packages/db`): Drizzle ORM with Supabase for secure data storage
- **UI** (`packages/ui`): shadcn/ui components shared across platforms
- **Analytics** (`packages/analytics`): PostHog integration for insights
- **Stripe** (`packages/stripe`): Payment processing for premium features
- **Email** (`packages/email`): Resend email service for notifications

## Key Features

### Trying to Conceive
- Menstrual cycle tracking with predictions
- Ovulation window calculations
- Fertility indicator logging (BBT, cervical mucus, etc.)
- Symptom and mood tracking
- Partner sharing for collaborative conception planning

### Pregnancy Tracking
- Week-by-week baby development updates
- Size comparison visualizations
- Symptom and weight tracking
- Appointment reminders
- Preparation checklists
- Photo diary

### Baby Care
- Feeding logs (breastfeeding, bottle, solids)
- Sleep pattern tracking
- Diaper change logs
- Growth charts (weight, height, head circumference)
- Medication tracking
- Healthcare provider reports

### Milestone Tracking
- Developmental milestone checklist
- Photo and video memories
- Achievement celebrations
- Age-appropriate activity suggestions
- Shareable milestone cards

## Development Workflow

### Adding New Features
1. **Define API** in `packages/api/src/router`
2. **Update Database** schema in `packages/db/src/schema`
3. **Generate Types** with `bun db:push`
4. **Create UI** components in `packages/ui`
5. **Implement** across all platforms with full type safety

### Essential Commands

```bash
# Development
bun dev                    # Start all apps
bun dev:next              # Web app only
bun test                  # Run tests
bun typecheck             # Type check everything

# Database Operations
bun db:studio             # Open database studio
bun db:push               # Push schema changes
bun db:gen-migration      # Generate migration
bun db:migrate            # Run migrations

# Code Quality
bun format:fix            # Format code
bun lint:ws               # Lint workspace

# Building
bun build                 # Build all packages
```

## Deployment

### Web App (Vercel)
```bash
vercel --prod
```

### Mobile Apps (EAS)
```bash
cd apps/expo
eas build --platform all
eas submit --platform all
```

## Technology Stack

- ✅ **Frontend**: React 19, Next.js 15, React Native, Expo
- ✅ **Backend**: tRPC v11, Drizzle ORM, Supabase
- ✅ **UI**: shadcn/ui, TailwindCSS, Framer Motion
- ✅ **Auth**: Clerk with social login support
- ✅ **Payments**: Stripe for premium subscriptions
- ✅ **Analytics**: PostHog for product insights
- ✅ **Email**: Resend for transactional emails
- ✅ **Type Safety**: End-to-end TypeScript

## Privacy & Security

Nugget takes your family's privacy seriously:

- 🔒 End-to-end encryption for all personal data
- 🏥 HIPAA-compliant infrastructure available for healthcare providers
- 🔐 SOC 2 Type II compliance in progress
- 👤 You own your data - export or delete anytime
- 🚫 No data selling or third-party sharing
- 📱 Biometric authentication support

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

- 📧 Email: support@nugget.baby
- 💬 Discord: https://discord.gg/nugget
- 📚 Documentation: https://docs.nugget.baby
- 🐛 Issues: https://github.com/seawatts/nugget/issues

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ for modern parents everywhere.
