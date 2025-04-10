#!/bin/bash

# Build and deploy script for local development

echo "🚀 Starting deployment..."

# Check if environment files exist
if [ ! -f "./frontend/.env.development" ]; then
    echo "❌ Error: Frontend environment file not found at ./frontend/.env.development"
    exit 1
fi

if [ ! -f "./backend/.env.development" ]; then
    echo "❌ Error: Backend environment file not found at ./backend/.env"
    exit 1
fi

# Copy environment files to Docker build context
echo "📋 Copying environment files..."
cp ./frontend/.env.development ./frontend/.env
cp ./backend/.env.development ./backend/.env

# Build frontend
echo "📦 Building frontend..."
docker build -t databridge-frontend:latest ./frontend

# Build backend
echo "📦 Building backend..."
docker build -t databridge-backend:latest ./backend

# Clean up copied environment files
echo "🧹 Cleaning up temporary files..."
rm ./frontend/.env
rm ./backend/.env

# Check if MongoDB is running
if [ "$(docker ps -q -f name=mongodb)" ]; then
    echo "✅ MongoDB is already running."
else
    echo "🔄 Starting MongoDB..."
    docker-compose up -d mongodb
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

echo "✅ Deployment complete!"
echo "Frontend running at: http://localhost:3001"
echo "Backend running at: http://localhost:3002"