FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY dist ./dist
COPY src/db/migrations ./src/db/migrations

EXPOSE 3000

CMD ["node", "dist/index.js"]
