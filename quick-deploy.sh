#!/bin/bash
# Fleet API Quick Deploy Script

set -e

echo "========================================="
echo "Fleet API Deployment Script"
echo "========================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "This script should not be run as root!"
   exit 1
fi

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_error "Node.js version must be 18 or higher. Current: $(node -v)"
            exit 1
        fi
        print_status "Node.js $(node -v) found"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    else
        print_status "npm $(npm -v) found"
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client not found. Make sure PostgreSQL is accessible."
    else
        print_status "PostgreSQL client found"
    fi
}

# Setup environment
setup_environment() {
    echo ""
    echo "Setting up environment..."
    
    # Create .env if not exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status "Created .env from .env.example"
            print_warning "Please edit .env file with your configuration!"
            
            # Prompt for basic configuration
            read -p "Enter PostgreSQL connection string (or press Enter to skip): " DB_URL
            if [ ! -z "$DB_URL" ]; then
                sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL|" .env
            fi
            
            # Generate random secrets
            JWT_SECRET=$(openssl rand -base64 32)
            SESSION_SECRET=$(openssl rand -base64 32)
            API_KEY="ak_prod_$(openssl rand -hex 10)"
            
            sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
            sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env
            sed -i "s|DEFAULT_API_KEY=.*|DEFAULT_API_KEY=$API_KEY|" .env
            
            print_status "Generated secure secrets"
            print_warning "Default API Key: $API_KEY (save this!)"
        else
            print_error ".env.example not found!"
            exit 1
        fi
    else
        print_status ".env file already exists"
    fi
    
    # Create directories
    mkdir -p uploads logs
    print_status "Created required directories"
}

# Install dependencies
install_dependencies() {
    echo ""
    echo "Installing dependencies..."
    
    npm ci --production
    print_status "Production dependencies installed"
}

# Build application
build_application() {
    echo ""
    echo "Building application..."
    
    # Install dev dependencies for build
    npm install
    print_status "Dev dependencies installed"
    
    # Run build
    npm run build
    print_status "Application built successfully"
}

# Setup database
setup_database() {
    echo ""
    echo "Setting up database..."
    
    # Load environment variables
    export $(grep -v '^#' .env | xargs)
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set in .env file!"
        exit 1
    fi
    
    # Run migrations
    npm run db:push
    print_status "Database migrations completed"
}

# Start with PM2
start_with_pm2() {
    echo ""
    echo "Starting application with PM2..."
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 not found. Installing globally..."
        npm install -g pm2
    fi
    
    # Stop existing instance if running
    pm2 stop fleetapi 2>/dev/null || true
    pm2 delete fleetapi 2>/dev/null || true
    
    # Start application
    pm2 start npm --name "fleetapi" -- start
    pm2 save
    
    print_status "Application started with PM2"
    print_status "View logs: pm2 logs fleetapi"
    print_status "View status: pm2 status"
}

# Docker deployment option
docker_deploy() {
    echo ""
    echo "Docker deployment..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi
    
    # Build and start containers
    docker-compose up -d --build
    
    print_status "Docker containers started"
    print_status "View logs: docker-compose logs -f"
    print_status "Stop: docker-compose down"
}

# Main menu
main_menu() {
    echo ""
    echo "Select deployment method:"
    echo "1) Standard deployment (PM2)"
    echo "2) Docker deployment"
    echo "3) Development mode"
    echo "4) Exit"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            check_prerequisites
            setup_environment
            install_dependencies
            build_application
            setup_database
            start_with_pm2
            
            echo ""
            print_status "Deployment completed!"
            echo "Application running at: http://localhost:5000"
            echo "API Documentation: http://localhost:5000/api/docs"
            echo "Health check: http://localhost:5000/api/health"
            ;;
        2)
            docker_deploy
            
            echo ""
            print_status "Docker deployment completed!"
            echo "Application running at: http://localhost:5000"
            echo "Nginx proxy at: http://localhost:80"
            ;;
        3)
            check_prerequisites
            setup_environment
            npm install
            
            echo ""
            print_status "Development setup completed!"
            echo "Start development server: npm run dev"
            ;;
        4)
            echo "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice!"
            main_menu
            ;;
    esac
}

# Run main menu
main_menu