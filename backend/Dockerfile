FROM node:18-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    libreoffice-java-common \
    default-jre-headless \
    python3-uno \
    python3 \
    fonts-dejavu \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Buat symlink agar soffice mudah ditemukan
RUN ln -sf /usr/bin/libreoffice /usr/local/bin/soffice || true

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN chmod -R 777 /tmp
ENV HOME=/tmp
# Tambahkan path LibreOffice ke PATH secara eksplisit
ENV PATH="/usr/lib/libreoffice/program:/usr/bin:${PATH}"

EXPOSE 3001
CMD ["node", "server.js"]