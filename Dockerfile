# Dockerfile for MediaSyndicate
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy cheerio and all its dependencies (needed for Telegram web scraping)
# Cheerio requires multiple dependencies that aren't included in standalone
COPY --from=builder /app/node_modules/cheerio ./node_modules/cheerio
COPY --from=builder /app/node_modules/cheerio-select ./node_modules/cheerio-select
COPY --from=builder /app/node_modules/css-select ./node_modules/css-select
COPY --from=builder /app/node_modules/dom-serializer ./node_modules/dom-serializer
COPY --from=builder /app/node_modules/htmlparser2 ./node_modules/htmlparser2
COPY --from=builder /app/node_modules/domelementtype ./node_modules/domelementtype
COPY --from=builder /app/node_modules/entities ./node_modules/entities
COPY --from=builder /app/node_modules/nth-check ./node_modules/nth-check

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

