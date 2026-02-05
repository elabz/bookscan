FROM node:18-alpine AS builder
RUN apk add --no-cache vips-dev build-base python3
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx tsc

FROM node:18-alpine
RUN apk add --no-cache vips
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
EXPOSE 4001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
