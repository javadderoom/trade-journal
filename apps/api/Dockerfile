# Stage 1: Build
FROM docker.arvancloud.ir/library/node:22.13-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm config set registry https://package-mirror.liara.ir/repository/npm/ && npm install --include=dev --no-audit --no-fund
COPY . .
RUN npx prisma generate --schema=apps/api/src/prisma/schema.prisma
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build --workspace=api

# Stage 2: Runner
FROM docker.arvancloud.ir/library/node:22.13-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
EXPOSE 3000
CMD ["sh", "-c", "for i in 1 2 3 4 5 6 7 8 9 10; do npx prisma migrate deploy --schema=apps/api/src/prisma/schema.prisma --config=apps/api/prisma.config.js && break || (echo 'Migration failed, retrying in 3s...' && sleep 3); done && node apps/api/dist/server.js"]
