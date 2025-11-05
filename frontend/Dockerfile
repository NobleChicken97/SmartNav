FROM node:18-alpine as builder

# Security: Update packages
RUN apk update && apk upgrade

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Security: Update packages and remove unnecessary packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Note: nginx user already exists in nginx:alpine image, no need to create it

# Copy built app with correct ownership
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Replace main nginx.conf to set pid to /tmp (writable in read-only containers)
COPY nginx-main.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Security: Change ownership of nginx directories
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /tmp/nginx.pid && \
    chown nginx:nginx /tmp/nginx.pid

# Switch to non-root user
USER nginx

# Security: Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

EXPOSE 3000

# Start nginx using our entrypoint script
CMD ["/usr/local/bin/docker-entrypoint.sh"]
