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
EXPOSE 4001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
