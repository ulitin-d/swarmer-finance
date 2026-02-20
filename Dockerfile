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

# Startup script generates nginx config at runtime using Render's $PORT
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 10000

CMD ["/app/start.sh"]
