#!/bin/bash
set -e

# Render injects PORT (default 10000). Nginx binds to it; backend uses a fixed internal port.
NGINX_PORT=${PORT:-10000}
BACKEND_PORT=3000

cat > /etc/nginx/http.d/default.conf << EOF
server {
    listen ${NGINX_PORT};
    server_name localhost;
    root /app/frontend/dist/swarmer-finance/browser;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Start backend on internal port (override Render's PORT for this process only)
PORT=${BACKEND_PORT} node /app/backend/dist/index.js &

# Start nginx in foreground (keeps container alive)
exec nginx -g 'daemon off;'
