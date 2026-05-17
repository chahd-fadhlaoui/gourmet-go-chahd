FROM node:22.12-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build -- --configuration production || npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist/order-management-ui/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
