FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache sqlite openssl
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD sh -c "npx prisma migrate deploy || npx prisma migrate dev --name init && npm run seed && npm run dev"
