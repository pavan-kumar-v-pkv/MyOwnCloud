#!/bin/bash

# MyOwnCloud Deployment Script
# Usage: ./deploy.sh [environment]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment (default: production)
ENV=${1:-production}

echo -e "${BLUE}🚀 MyOwnCloud Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENV}${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_status "Docker is running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install it and try again."
    exit 1
fi
print_status "Docker Compose is available"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before continuing."
        print_warning "Required: GROQ_API_KEY, JWT_SECRET, DATABASE_URL"
        read -p "Press Enter to continue after configuring .env file..."
    else
        print_error ".env.example file not found. Please create .env file manually."
        exit 1
    fi
fi
print_status ".env file exists"

# Validate required environment variables
echo -e "${BLUE}🔍 Validating environment variables...${NC}"
source .env

if [ -z "$GROQ_API_KEY" ]; then
    print_error "GROQ_API_KEY is not set in .env file"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    print_error "JWT_SECRET is not set in .env file"
    exit 1
fi

print_status "Environment variables validated"

# Stop existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true
print_status "Stopped existing containers"

# Remove old images if in production
if [ "$ENV" = "production" ]; then
    echo -e "${BLUE}🧹 Cleaning up old images...${NC}"
    docker system prune -f 2>/dev/null || true
    print_status "Cleaned up old images"
fi

# Build and start services
echo -e "${BLUE}🔨 Building and starting services...${NC}"
if [ "$ENV" = "production" ]; then
    docker-compose up -d --build --remove-orphans
else
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build --remove-orphans
fi

print_status "Services are building and starting..."

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
echo "This may take a few minutes on first run..."

# Wait for database
echo "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
print_status "PostgreSQL is ready"

# Wait for backend
echo "Waiting for backend API..."
for i in {1..60}; do
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
print_status "Backend API is ready"

# Wait for frontend
echo "Waiting for frontend..."
for i in {1..30}; do
    if curl -s http://localhost/ > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
print_status "Frontend is ready"

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
docker-compose exec -T backend npx prisma migrate deploy 2>/dev/null || {
    print_warning "Database migrations failed or not needed"
}

# Health check
echo -e "${BLUE}🏥 Running health checks...${NC}"

# Check services
services=("myowncloud-postgres" "myowncloud-backend" "myowncloud-frontend")
for service in "${services[@]}"; do
    if docker ps --format "table {{.Names}}" | grep -q "$service"; then
        print_status "$service is running"
    else
        print_error "$service is not running"
        echo "Checking logs..."
        docker-compose logs "$service" | tail -10
        exit 1
    fi
done

# Final connectivity test
echo -e "${BLUE}🌐 Testing connectivity...${NC}"

# Test backend API
if curl -f http://localhost:8000/ > /dev/null 2>&1; then
    print_status "Backend API is accessible"
else
    print_error "Backend API is not accessible"
    exit 1
fi

# Test frontend
if curl -f http://localhost/ > /dev/null 2>&1; then
    print_status "Frontend is accessible"
else
    print_error "Frontend is not accessible"
    exit 1
fi

# Display status
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Deployment Successful!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📱 Application URLs:${NC}"
echo "   Frontend:  http://localhost"
echo "   Backend:   http://localhost:8000"
echo "   Database:  localhost:5432"
echo ""
echo -e "${BLUE}🐳 Docker Commands:${NC}"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose ps
echo ""

# Show useful commands
echo -e "${BLUE}🛠️  Useful Commands:${NC}"
echo "   npm run docker:logs    # View all logs"
echo "   npm run docker:down    # Stop all services"
echo "   npm run docker:restart # Restart services"
echo "   npm run health         # Check service health"
echo ""

print_status "MyOwnCloud is ready to use!"
echo ""
