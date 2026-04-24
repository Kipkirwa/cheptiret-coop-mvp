# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration to proxy API requests
RUN echo 'server { \
    listen 80; \
    server_name _; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri /index.html; \
    } \
    location /api/ { \
        proxy_pass https://cheptiret-coop-mvp-backend-production.up.railway.app/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
