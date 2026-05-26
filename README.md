# Digital Covet Portfolio

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better_Auth-6C47FF?style=for-the-badge&logo=authentication&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA?style=for-the-badge&logo=biome&logoColor=white)

---

A secure, multi-tenant digital portfolio platform for agencies and creative firms to showcase case studies, manage client work, and share curated portfolios with external stakeholders. Built with role-based access control, two-factor authentication, and fine-grained sharing capabilities.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Case Study Management** — Full CRUD with rich markdown content, image galleries, video embeds, file attachments, KPI metrics, and testimonials
- **Shareable Portfolios** — Create password-protected, expiring share links with filtered case study collections; public gallery view with lightbox
- **Client Management** — Manage client records with logo uploads and taxonomy associations
- **Taxonomy System** — Hierarchical classification (Sector → Industry → Key Business) plus Work Categories, Services, and Business Models
- **Role-Based Access Control** — Three roles (Employee, Admin, Superadmin) with department-scoped data isolation
- **Authentication** — Email/password login, TOTP two-factor authentication, password reset flow, invite-based registration
- **User Management** — Invite system, role assignment, user deletion with data transfer
- **Cloud File Storage** — Presigned URL uploads to Cloudflare R2 with per-user authorization
- **Dashboard & Analytics** — Aggregate case study and share-link statistics with Chart.js visualizations and PDF export
- **Dark/Light Theme** — CSS variable-based theming via `next-themes`
- **Email Notifications** — ZeptoMail integration for invites, password resets, and email verification

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 6 |
| **UI Library** | React 19, shadcn/ui (Base Lyra), Base UI React |
| **Styling** | Tailwind CSS v4, `tw-animate-css` |
| **State** | Redux Toolkit |
| **Forms / Validation** | Zod 4 |
| **Database** | PostgreSQL (via Supabase) |
| **ORM** | Prisma 7 |
| **Authentication** | Better Auth (email/password, 2FA TOTP, RBAC) |
| **File Storage** | Cloudflare R2 (S3-compatible) |
| **Email** | ZeptoMail |
| **Icons** | Phosphor Icons |
| **Charts** | Chart.js |
| **PDF** | jsPDF |
| **Linter / Formatter** | Biome |

## Project Structure

```
├── prisma/
│   ├── schema.prisma            # Database schema & models
│   └── migrations/              # Prisma migrations
├── src/
│   ├── actions/                 # Next.js Server Actions (RPC layer)
│   │   ├── case-studies.ts      # Case study CRUD
│   │   ├── clients.ts           # Client CRUD
│   │   ├── files.ts             # Presigned upload URLs
│   │   ├── share.ts             # Share link CRUD
│   │   ├── taxonomies.ts        # Taxonomy management
│   │   ├── user.ts              # User management
│   │   ├── invite.ts            # Invitation workflow
│   │   └── account.ts           # Account settings
│   ├── app/
│   │   ├── (app)/               # Authenticated layout group
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── case-studies/    # Case study list & editor
│   │   │   ├── clients/         # Client management
│   │   │   ├── shares/          # Share link management
│   │   │   ├── taxonomies/      # Taxonomy management
│   │   │   └── users/           # User management
│   │   ├── auth/                # Public auth pages
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   ├── setup-password/
│   │   │   ├── setup-2fa/
│   │   │   └── verify-2fa/
│   │   ├── shares/[token]/      # Public shareable portfolio
│   │   └── api/                 # API route handlers
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── account/             # Account settings components
│   │   ├── case-studies/        # Case study editor & list
│   │   ├── clients/             # Client CRUD components
│   │   ├── dashboard/           # Dashboard widgets
│   │   ├── shares/              # Share link components
│   │   └── users/               # User management components
│   ├── db/                      # Prisma client singleton
│   ├── hooks/                   # React hooks
│   ├── lib/
│   │   ├── auth.ts              # Better Auth server config
│   │   ├── auth-client.ts       # Better Auth browser client
│   │   ├── auth.server.ts       # Server auth helpers
│   │   ├── permission.ts        # RBAC definitions
│   │   ├── rbac.ts              # Scoped data filters
│   │   ├── r2.ts                # Cloudflare R2 client
│   │   └── constants.ts         # App-wide constants
│   ├── redux/                   # Redux store & slices
│   ├── schemas/                 # Zod validation schemas
│   ├── services/                # Business logic services
│   └── types/                   # TypeScript type definitions
├── public/                      # Static assets
├── generated/prisma/            # Auto-generated Prisma client
├── middleware.ts                # Auth middleware & CSP headers
├── next.config.ts               # Next.js configuration
├── components.json              # shadcn/ui configuration
└── biome.json                   # Lint & format configuration
```

## Prerequisites

- **Node.js** v22 or later
- **pnpm** — Install via `npm install -g pnpm` or your preferred method
- **PostgreSQL** database — A Supabase (or any PostgreSQL) instance
- **Cloudflare R2** account — For file storage (S3-compatible)
- **ZeptoMail** account — For transactional emails

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd digital-covet-portfolio
```

### 2. Install dependencies

```bash
pnpm install
```

This runs `prisma generate` automatically via the `postinstall` script.

### 3. Set up environment variables

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|---|---|
| `BETTER_AUTH_SECRET` | Secret key for auth token signing |
| `BETTER_AUTH_URL` | Application base URL (`http://localhost:3000` for development) |
| `DATABASE_URL` | PostgreSQL connection string (with pgBouncer) |
| `DIRECT_URL` | Direct PostgreSQL connection string (for migrations) |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | Cloudflare R2 bucket name |
| `ZEPTOMAIL_URL` | ZeptoMail API endpoint |
| `ZEPTOMAIL_TOKEN` | ZeptoMail API token |
| `ZEPTOMAIL_SENDER_ADDRESS` | Sender email address |
| `NEXT_PUBLIC_URL` | Public-facing application URL |

### 4. Run database migrations

```bash
pnpm prisma migrate dev
```

### 5. Start the development server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Usage

### Development

```bash
pnpm dev          # Start Next.js dev server
pnpm lint         # Lint with Biome
pnpm format       # Format code with Biome
```

### Building for production

```bash
pnpm build        # Generates Prisma client & builds Next.js
pnpm start        # Start production server
```

### Database management

```bash
pnpm db:push               # Push schema changes (dev databases only)
pnpm db:seed               # Seed taxonomy data (industries, sectors, etc.)
```

### First-time setup

1. Navigate to `/auth/login`
2. An admin user must be created via the invite workflow or database seed
3. Once logged in, configure taxonomy classifications under **Taxonomies**
4. Create **Clients** and associate them with taxonomies
5. Create **Case Studies** with rich content, metrics, and media
6. Use **Shares** to generate password-protected, expiring portfolio links

### User roles

| Role | Permissions |
|---|---|
| **Superadmin** | Full system access, user management, role assignment |
| **Admin** | Department-scoped CRUD for case studies, clients, taxonomies |
| **Employee** | View-only access within department constraints |

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Generate Prisma client and build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run Biome linting |
| `pnpm format` | Format code with Biome |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:seed` | Seed taxonomy data |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add new feature'`)
4. Push the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

Please ensure your code passes linting (`pnpm lint`) and follows the existing code conventions. All server actions return typed `ActionResult<T>` responses, and validation schemas are defined with Zod.

## License

[MIT](LICENSE) — or your chosen license. This project is currently unlicensed; see the repository owner for details.
