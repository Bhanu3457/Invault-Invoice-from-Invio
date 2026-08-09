# Runtime with WeasyPrint-based PDF rendering and Deno 2.6
FROM debian:12-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install minimal dependencies for Deno, SQLite, fonts, and WeasyPrint
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  fontconfig \
  tar \
  unzip \
  python3 \
  weasyprint \
  fonts-dejavu \
  fonts-liberation \
  fonts-noto \
  fonts-noto-cjk \
  fonts-noto-color-emoji \
  libpango-1.0-0 \
  libpangoft2-1.0-0 \
  libharfbuzz0b \
  libharfbuzz-subset0 \
  libcairo2 \
  libglib2.0-0 \
  libexpat1 \
  && rm -rf /var/lib/apt/lists/*

# Install Deno 2.6.8
COPY --from=denoland/deno:bin-2.6.8 /deno /usr/local/bin/deno

WORKDIR /app
COPY . .
RUN mkdir -p /app/data

ENV PORT=3000 \
  DATABASE_PATH=/app/data/invio.db \
  WEASYPRINT_BIN=/usr/bin/weasyprint

EXPOSE 3000
CMD ["deno", "task", "start"]