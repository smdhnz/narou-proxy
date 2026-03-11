# Base image
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Step 1: Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Step 2: Build the app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
# Note: Next.js standalone output works with Node.js directly.
# But we can still run it with Bun if needed, or use node for maximum compatibility.
RUN bun run build

# Step 3: Runner
FROM oven/bun:1-distroless AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copy essential files only
COPY --from=builder /app/public ./public
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

USER bun
EXPOSE 3000

# Next.js standalone output creates a 'server.js' file
CMD ["bun", "server.js"]
