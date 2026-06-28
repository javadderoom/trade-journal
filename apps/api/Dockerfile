# Stage 1: Build
FROM node:22.13-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm config set registry https://mirror-npm.runflare.com && npm install --include=dev --no-audit --no-fund
COPY . .
RUN npx prisma generate --schema=apps/api/src/prisma/schema.prisma
RUN npm run build --workspace=api

# Stage 2: Runner
FROM node:22.13-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/api/src/prisma/schema.prisma --config=apps/api/src/prisma/prisma.config.ts && node apps/api/dist/server.js"]
