# CaseFlow Docker Container
# Build order: npm ci → npm run build → prisma generate → prisma migrate deploy → start

FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --include=dev

# Copy source
COPY . .

# Build TypeScript and React/Vite
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

FROM node:24-alpine AS runner

WORKDIR /app

# Copy production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start: run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
