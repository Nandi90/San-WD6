FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY src/frontend/package.json src/frontend/package-lock.json* ./
RUN npm ci --production=false 2>/dev/null || npm install
COPY src/frontend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl tini chromium chromium-chromedriver nss freetype harfbuzz ca-certificates ttf-freefont
COPY src/backend/package.json src/backend/package-lock.json* ./
RUN npm ci --production 2>/dev/null || npm install --production
COPY src/backend/ ./
COPY --from=frontend-build /build/dist ./public
RUN addgroup -S app && adduser -S app -G app &&     mkdir -p /data/pdf &&     chown -R app:app /app /data
EXPOSE 3000
USER app
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
