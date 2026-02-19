# Multi-stage сборка
FROM node:20-alpine AS builder

WORKDIR /app

# Бэкенд
COPY backend/package*.json backend/
RUN cd backend && npm install
COPY backend/ backend/
RUN cd backend && npm run build

# Фронтенд  
COPY frontend/package*.json frontend/
RUN cd frontend && npm install
COPY frontend/ frontend/
RUN cd frontend && npm run build

# Production образ
FROM node:20-alpine

RUN apk add --no-cache nginx bash

WORKDIR /app

# Копируем бэкенд
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package*.json ./backend/

# Копируем фронтенд
COPY --from=builder /app/frontend/dist ./frontend/dist

# Nginx конфиг - /api -> localhost:3000
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /app/frontend/dist/swarmer-finance/browser; \
    index index.html; \
    location / { try_files $uri $uri/ /index.html; } \
    location /api/ { \
        proxy_pass http://127.0.0.1:3000/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/http.d/default.conf

EXPOSE 80

CMD ["bash", "-c", "nginx & cd /app/backend && node dist/index.js"]
