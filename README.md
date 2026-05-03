# Digital Covet Portfolio

A portfolio management system for digital agencies with case studies, client management, secure share links, and team collaboration.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen)](https://nodejs.org) [![License: MIT](https://img.shields.io/badge/License-MIT-blue)](LICENSE) ![Build Status](https://img.shields.io/badge/build-passing-brightgreen)

## Quick Start

```bash
npm install
npx prisma generate
npm run dev
```

Create and push your database schema:

```bash
npx prisma db push
# Or for production migrations:
npx prisma migrate deploy
```

## Features

- **Case Studies CRUD** — Create, read, update, and delete portfolio case studies with rich content (hero images, galleries, videos, metrics, testimonials)
- **Client Management** — Manage clients with logos, industry associations, and link projects to clients
- **Secure Share Links** — Generate shareable portfolio links with optional password protection, expiration dates, and view limits
- **QR Code Generation** — Every share link includes a scannable QR code for easy access
- **Invitation System** — Invite team members via email with role-based access and expiration tokens
- **Two-Factor Authentication (2FA)** — Enable TOTP-based 2FA for enhanced account security
- **PDF Export** — Export filtered portfolio dashboards to PDF using jsPDF
- **Role-Based Access Control (RBAC)** — Assign roles (admin, employee) to control permissions

## Installation

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or cloud-hosted like Supabase)

### Environment Variables

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# Authentication
BETTER_AUTH_SECRET="your-64-char-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Email (Zeptomail)
ZEPTOMAIL_URL="https://api.zeptomail.in/v1.1/email"
ZEPTOMAIL_TOKEN="your-zeptomail-api-token"
ZEPTOMAIL_SENDER_ADDRESS="noreply@yourdomain.com"
```

### Setup Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push

# Start development server
npm run dev
```

## Usage Examples

### Create a Case Study (Server Action)

```typescript
import { upsertCaseStudy } from "@/actions/content";

const result = await upsertCaseStudy({
  title: "Acme Corp Brand Refresh",
  slug: "acme-corp-brand-refresh-2024",
  client_id: "550e8400-e29b-41d4-a716-446655440000",
  industry_id: "110e8400-e29b-41d4-a716-446655440000",
  project_date: "2024-03-15",
  hero_image_url: "https://example.com/hero.jpg",
  gallery_urls: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
  description: "Complete brand identity redesign including logo, guidelines, and digital assets.",
  challenge: "Outdated visual identity not reflecting company growth.",
  solution: "Modern design system with flexible components.",
  results: "40% increase in brand recognition.",
  status: "published",
  category_ids: ["220e8400-e29b-41d4-a716-446655440000"],
  service_ids: ["330e8400-e29b-41d4-a716-446655440000"],
  metrics: [
    { label: "Brand Recognition", value: "40", unit: "%" },
    { label: "Client Satisfaction", value: "4.8", unit: "/5" },
  ],
});

// Returns: { id: "case-study-uuid" }
```

### Generate a Share Link (Server Action)

```typescript
import { createShare } from "@/actions/share";

const result = await createShare({
  name: "Q1 Portfolio Review - Acme",
  password: "securePassword123",
  recipient_name: "John Doe",
  recipient_email: "john@acme.com",
  expires_at: "2024-06-30T23:59:00Z",
  max_views: 50,
  filter_industry_ids: ["110e8400-e29b-41d4-a716-446655440000"],
  filter_client_ids: ["550e8400-e29b-41d4-a716-446655440000"],
});

// Returns: { id: "share-uuid", url: "/s/abc123-token" }
// Access at: https://yourdomain.com/s/abc123-token
```

### Export PDF (Dashboard)

Navigate to `/dashboard`, apply filters, and click **Download PDF**. The PDF includes:
- Summary metrics (total case studies, published count, active shares)
- Filtered case studies table with title, client, industry, status, and date

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `DIRECT_URL` | Direct database connection (for connection pooling) | Yes | - |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth (min 32 chars) | Yes | - |
| `BETTER_AUTH_URL` | Application URL | Yes | `http://localhost:3000` |
| `ZEPTOMAIL_URL` | Zeptomail API endpoint | No | - |
| `ZEPTOMAIL_TOKEN` | Zeptomail API token | No | - |
| `ZEPTOMAIL_SENDER_ADDRESS` | Verified sender email | No | - |
| `NODE_ENV` | Environment mode | No | `development` |

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invitation?email={email}` | Get active invitation link by email |
| POST | `/api/send-invite-email` | Send invitation email to user |
| POST | `/api/auth/[...all]` | Better Auth endpoints (sign-in, sign-up, session, etc.) |

### Authentication Endpoints

All Better Auth routes under `/api/auth/`:
- `POST /api/auth/sign-in` — Email/password sign in
- `POST /api/auth/sign-up` — Email/password sign up
- `GET /api/auth/get-session` — Retrieve current session
- `POST /api/auth/sign-out` — Sign out
- `POST /api/auth/verify-mfa` — Verify 2FA code
- `POST /api/auth/setup-mfa` — Enable 2FA

## Contributing

### Running Tests

```bash
npm run lint
```

### Code Style

This project uses [Biome](https://biomejs.dev) for linting and formatting:

```bash
npm run lint    # Check for issues
npm run format # Auto-format code
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/name`)
3. Make changes and run `npm run lint`
4. Commit with descriptive messages
5. Push and open a PR

## License

MIT — see [LICENSE](LICENSE) for details.