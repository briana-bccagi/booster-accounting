#!/bin/bash
set -e

export PATH="/Users/brianatalley/nodejs/bin:$PATH"

echo "Building Booster Club Accounting App..."

# Generate Prisma client
npx prisma generate

# Build Next.js app
npx next build

echo "Deploying to Vercel..."
vercel --token "$VERCEL_TOKEN" --yes "$@"

