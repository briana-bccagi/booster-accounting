#!/bin/bash
set -e

export PATH="/Users/brianatalley/nodejs/bin:$PATH"

echo "Building SPHS Band Booster..."

# Generate Prisma client
npx prisma generate

# Build Next.js app
npx next build

echo "Deploying to Vercel..."
vercel --token "$VERCEL_TOKEN" --yes "$@"

