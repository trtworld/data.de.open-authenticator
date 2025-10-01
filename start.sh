#!/bin/bash

echo "🚀 Starting Authenticator TRT..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "📝 Creating .env.production from example..."
    cp .env.production.example .env.production
    echo "⚠️  Please edit .env.production and update ENCRYPTION_KEY and JWT_SECRET"
    echo "   Generate keys with: openssl rand -base64 32"
    echo ""
    read -p "Press Enter to continue with default keys (NOT SECURE for production)..."
fi

# Create data directory
mkdir -p data

echo "🔨 Building Docker image..."
docker-compose build

echo "🚀 Starting container..."
docker-compose up -d

echo ""
echo "✅ Authenticator TRT is running!"
echo ""
echo "📍 Access: http://localhost:3000"
echo "👤 Admin login: admin / admin"
echo "👁️  Viewer login: viewer / viewer"
echo ""
echo "📋 Useful commands:"
echo "  docker-compose logs -f    # View logs"
echo "  docker-compose ps         # Check status"
echo "  docker-compose down       # Stop"
echo "  docker-compose restart    # Restart"
echo ""
