# Fleet Management System - Setup Instructions

This document provides instructions for setting up the Fleet Management System in a new environment.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

## Environment Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd fleet-management
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment variables file

Create a `.env` file in the root directory with the following variables:

```bash
# Node Environment
NODE_ENV=development  # or 'production' for production

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name

# JWT & Session Secrets (IMPORTANT: Generate secure random strings!)
# You can generate secure secrets using: openssl rand -base64 32
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters
SESSION_SECRET=your_secure_session_secret_minimum_32_characters

# API Security Configuration
API_RATE_LIMIT=1000
DEFAULT_API_KEY=your_api_key_here

# CORS Configuration
CORS_ORIGIN=http://localhost:5000  # Update for production
TRUST_PROXY=false  # Set to true if behind a proxy

# Domain Filtering (for production)
ALLOWED_DOMAIN=filokiapi.architectaiagency.com

# Optional configurations
# REDIS_URL=redis://localhost:6379
# MAX_FILE_SIZE=50MB
# UPLOAD_PATH=./uploads
# LOG_LEVEL=debug
# LOG_FILE_PATH=./logs
```

### 4. Database Setup

#### Option A: Push schema to database (recommended for new installations)
```bash
npm run db:push
```

#### Option B: Generate and run migrations
```bash
npm run db:generate
npm run db:migrate
```

### 5. Run the application

#### Development mode:
```bash
npm run dev
```

#### Production mode:
```bash
npm run build
npm start
```

## Production Deployment

### Additional Production Environment Variables

For production deployment, ensure these additional configurations:

```bash
# Production-specific
NODE_ENV=production
CORS_ORIGIN=https://your-production-domain.com
TRUST_PROXY=true
LOG_LEVEL=info

# Security (Generate new values!)
JWT_SECRET=<generate-new-secure-secret>
SESSION_SECRET=<generate-new-secure-secret>
DEFAULT_API_KEY=<generate-new-api-key>

# Domain restriction
ALLOWED_DOMAIN=filokiapi.architectaiagency.com
```

### Security Best Practices

1. **Generate secure secrets**: Use `openssl rand -base64 32` to generate secure random strings
2. **Database credentials**: Use strong passwords and limit database access
3. **API Keys**: Generate unique API keys for production
4. **HTTPS**: Always use HTTPS in production
5. **Environment variables**: Never commit `.env` files to version control

### Database Connection

Make sure your PostgreSQL database is running and accessible. The connection string format is:
```
postgresql://username:password@host:port/database_name
```

### Port Configuration

The default port is 5000. If you need to change it, update the PORT environment variable.

## Troubleshooting

### Database connection issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database user has proper permissions

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility (18+)

### Runtime errors
- Check all required environment variables are set
- Verify database schema is up to date: `npm run db:push`
- Check logs for detailed error messages

## API Documentation

Once the application is running, you can access the API documentation at:
- Development: `http://localhost:5000/api/docs`
- Production: `https://your-domain.com/api/docs`

## Support

For issues or questions, please refer to the project documentation or contact the development team.