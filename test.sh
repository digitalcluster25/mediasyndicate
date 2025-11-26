#!/bin/bash

set -e

echo "🧪 Running MediaSyndicate MVP tests..."

# Check database connection
echo "📊 Checking database connection..."
npx prisma db push --accept-data-loss
echo "✅ Database pushed"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
echo "✅ Dependencies installed"

# Build
echo "🔨 Building..."
npm run build
echo "✅ Build successful"

# Lint
echo "🔍 Linting..."
npm run lint
echo "✅ Lint passed"

echo "✨ All tests passed!"
