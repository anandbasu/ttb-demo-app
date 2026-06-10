# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm install --include=dev

COPY client ./client
COPY tailwind.config.js ./
RUN npx vite build --config client/vite.config.js

# ----- runtime -----
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production \
    UPLOAD_DIR=/data/uploads

RUN apt-get update \
 && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-eng ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev

COPY server ./server
COPY --from=build /app/dist ./dist

RUN mkdir -p /data/uploads
VOLUME ["/data"]

EXPOSE 3000
CMD ["node", "server/index.js"]
