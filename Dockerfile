FROM node:22 AS base

RUN apt-get update && apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Verify installations
RUN node --version && npm --version && python3 --version

# Set working directory
WORKDIR /app

# Ensure runtime directories exist before startup initializes the database or logs
RUN mkdir -p /app/data /app/logs

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose the port your Express app listens on
EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
