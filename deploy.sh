#!/bin/bash

echo "🚀 Fleet Management API Deployment Started"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

# Stop PM2 if running
echo "⏹️  Stopping existing PM2 processes..."
pm2 stop fleet-management-api 2>/dev/null || echo "No existing PM2 process found"

# Git pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Start PM2 with clustering
echo "🚀 Starting PM2 with clustering..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Reload Nginx (requires sudo)
echo "🔄 Reloading Nginx..."
if command -v nginx &> /dev/null; then
    sudo systemctl reload nginx || echo "⚠️  Could not reload Nginx (check permissions)"
else
    echo "⚠️  Nginx not found, skipping reload"
fi

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 API erişim: http://localhost:5000 (or your domain)"
echo "📚 API docs: http://localhost:5000/api/docs"
echo "📝 Health check: http://localhost:5000/api/health"
echo ""
echo "📋 Useful commands:"
echo "   pm2 status          - Check application status"
echo "   pm2 logs            - View application logs"
echo "   pm2 monit           - Real-time monitoring"
echo "   pm2 restart all     - Restart application"