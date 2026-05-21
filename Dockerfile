# Stage 1: Build frontend
FROM node:18 AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Final stage
FROM node:18
WORKDIR /app

# Copy backend and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy built frontend
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy backend code
COPY server ./server

# Expose both ports
ENV PORT=5000
EXPOSE 5000 5173

# Start the backend server
CMD ["node", "server/server.js"]
