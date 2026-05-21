#!/bin/sh

# Start backend in background
echo "🚀 Starting backend on port 5000..."
node server/server.js &
BACKEND_PID=$!

# Start frontend dev server
echo "⚡ Starting frontend on port 5173..."
cd client
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
