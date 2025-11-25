# ✅ Dockerfile per Pastificio Backend Railway Deployment
# Node.js 20 Alpine (leggera e veloce)
FROM node:20-alpine

# Installa dipendenze di sistema per Puppeteer e WhatsApp
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    dumb-init

# Configura Puppeteer per usare Chromium di sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Imposta working directory
WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze production
RUN npm ci --omit=dev --ignore-scripts

# Copia il codice sorgente
COPY . .

# Crea directory necessarie
RUN mkdir -p .wwebjs_auth backups logs uploads assets/fonts assets/images sounds

# Espone porta 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usa dumb-init per gestire correttamente i segnali
ENTRYPOINT ["dumb-init", "--"]

# Avvia server
CMD ["node", "server.js"]