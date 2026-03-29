FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install
RUN apk del python3 make g++
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
