#!/bin/bash

# Quick Start Script for ITSM Platform
# This script sets up and starts the ITSM Platform with Docker

set -e

echo "=========================================="
echo "  ITSM Platform - Quick Start Setup"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker found: $(docker --version)"
echo "✅ Docker Compose found: $(docker-compose --version)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    
    # Generate random passwords
    DB_PASSWORD=$(openssl rand -base64 24)
    REDIS_PASSWORD=$(openssl rand -base64 24)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Update .env with generated passwords
    sed -i.bak "s/DB_PASSWORD=changeme/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i.bak "s/REDIS_PASSWORD=changeme/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
    sed -i.bak "s/JWT_SECRET=your-secret-key-change-in-production/JWT_SECRET=$JWT_SECRET/" .env
    rm .env.bak
    
    echo "✅ Generated secure passwords in .env"
else
    echo "✅ .env file already exists"
fi

echo ""

# Ask deployment type
echo "Select deployment type:"
echo "1) Development (API only, no SSL)"
echo "2) Production (with Nginx and SSL)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo ""
        echo "Starting development environment..."
        docker-compose build
        docker-compose up -d
        
        echo ""
        echo "=========================================="
        echo "  Development Environment Started!"
        echo "=========================================="
        echo ""
        echo "API URL: http://localhost:3000"
        echo "Health Check: http://localhost:3000/health"
        echo ""
        echo "Database:"
        echo "  Host: localhost"
        echo "  Port: 5432"
        echo "  Database: itsm_platform"
        echo ""
        echo "Redis:"
        echo "  Host: localhost"
        echo "  Port: 6379"
        echo ""
        echo "Useful commands:"
        echo "  make logs       - View logs"
        echo "  make health     - Check health"
        echo "  make shell-api  - Open API shell"
        echo "  make shell-db   - Open database shell"
        echo "  make down       - Stop services"
        echo ""
        ;;
    2)
        echo ""
        echo "Setting up production environment..."
        
        echo ""
        echo "Building and starting services..."
        docker-compose build
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
        
        echo ""
        echo "=========================================="
        echo "  Production Environment Started!"
        echo "=========================================="
        echo ""
        echo "API URL (direct): http://localhost:3000"
        echo "API URL (via Nginx): http://localhost"
        echo "Health Check: http://localhost/health"
        echo ""
        echo "⚠️  Important Security Notes:"
        echo "  1. Review and update passwords in .env"
        echo "  2. This setup uses HTTP only (no SSL/TLS)"
        echo "  3. For HTTPS, configure SSL at your load balancer level"
        echo "  4. Configure firewall to only expose port 80"
        echo "  5. Set up automated backups (see DEPLOYMENT.md)"
        echo "  6. Configure monitoring and alerting"
        echo ""
        echo "Useful commands:"
        echo "  make logs       - View logs"
        echo "  make health     - Check health"
        echo "  make backup     - Backup database"
        echo "  make down       - Stop services"
        echo ""
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check health
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ API is healthy!"
else
    echo "⚠️  API health check failed. Check logs with: make logs-api"
fi

echo ""
echo "Setup complete! 🎉"
echo ""
echo "Next steps:"
echo "  1. Review the documentation: README.md"
echo "  2. Check deployment guide: DEPLOYMENT.md"
echo "  3. Review production checklist: PRODUCTION-CHECKLIST.md"
echo ""
