# SPHS Band Booster

A full-stack financial management application for booster clubs, deployed on Vercel with a persistent PostgreSQL database.

## Features

- **Account Overview Dashboard** — Real-time balance, deposits, withdrawals, and pending transactions
- **Ledger** — Full CRUD for transactions with auto-incrementing voucher numbers
- **Vouchers/Receipts** — Upload and attach receipt images to transactions
- **Categories** — Predefined deposit and withdrawal categories
- **Cleared Status** — Track whether transactions have cleared the bank

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Styling:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod
- **File Storage:** Vercel Blob (for receipt images)
- **Deployment:** Vercel

## Database Setup (Supabase)

Since Vercel's serverless functions don't support persistent SQLite, this app uses **Supabase PostgreSQL** for long-term data storage.

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click **"New Project"**
3. Choose an organization and name your project (e.g., `booster-accounting`)
4. Set a secure database password (save this!)
5. Choose a region close to your users
6. Wait for the project to be created (~2 minutes)

### 2. Get Your Connection String

1. In your Supabase dashboard, go to **Project Settings** → **Database**
2. Scroll to **Connection String** section
3. Click on **URI** tab
4. Copy the connection string. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Apply the Database Schema

Option A — Using Prisma Migrate (recommended):
```bash
# Set your Supabase connection string temporarily
export DATABASE_URL="postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres"

# Run migrations
npx prisma migrate deploy
```

Option B — Using Supabase SQL Editor:
1. In Supabase dashboard, go to **SQL Editor** → **New Query**
2. Copy the contents of `prisma/migrations/20260427180000_init/migration.sql`
3. Paste and click **Run**

### 4. Configure Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following:
   - `DATABASE_URL` = your Supabase connection string
   - `BLOB_READ_WRITE_TOKEN` = your Vercel Blob token (for receipt uploads)

### 5. Redeploy

```bash
vercel --prod
```

## Local Development

### Prerequisites

- Node.js 18+
- A PostgreSQL database (local or Supabase)

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
npx prisma generate

# Run database migrations (if using local Postgres)
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── actions.ts          # Server Actions (CRUD + upload)
│   ├── page.tsx            # Dashboard / Account Overview
│   ├── ledger/
│   │   └── page.tsx        # Ledger with full CRUD
│   └── vouchers/
│       └── page.tsx        # Receipt upload & gallery
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   └── utils.ts            # Utility functions
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## Deployment

The app is configured for Vercel deployment:

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for receipt uploads | Yes |

## License

MIT

