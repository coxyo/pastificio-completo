# Usa Node 20
FROM node:20-alpine

# Installa dipendenze per Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Imposta variabili per Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Directory di lavoro
WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --omit=dev

# Copia tutto il codice
COPY . .

# Crea directory per WhatsApp
RUN mkdir -p .wwebjs_auth

# Porta
EXPOSE 3000

# Comando di avvio
CMD ["node", "server.js"]