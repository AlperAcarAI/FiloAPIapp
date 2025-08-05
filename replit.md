# Filo Yönetim Sistemi

## Repository Description
A fleet management platform designed for multi-tenant operations. All authentication has been removed and the system now only accepts requests from a specific domain.

## Recent Changes (January 2025)
- **Authentication Removal**: Removed all authentication protocols (JWT tokens, bearer tokens, API keys)
- **Domain Filtering**: Set up URL filtering to only accept requests from `filokiapi.architectaiagency.com`
- **UI Updates**: Removed login functionality and authentication UI components
- **API Access**: All APIs are now directly accessible without authentication
- **JSON Responses**: All API endpoints return data in JSON format
- **Fixed Missing APIs**: Added all reference data endpoints that were returning HTML:
  - General Reference: getCountries, getCarBrands, getCarModels, getCarTypes, getOwnershipTypes, getPersonnelPositions, getWorkAreas, getPaymentMethods
  - Document Types: getDocMainTypes, getDocSubTypes
  - Other Types: getMaintenanceTypes, getPenaltyTypes, getPolicyTypes
  - Personnel: getPersonnel

## Project Architecture

### Frontend
- React with TypeScript
- Wouter for routing (no protected routes)
- Shadcn UI components
- TanStack Query for data fetching
- All pages are publicly accessible

### Backend
- Express.js server
- PostgreSQL database with Drizzle ORM
- Domain-based request filtering (only accepts from filokiapi.architectaiagency.com)
- All endpoints return JSON format responses
- No authentication middleware

### Security Configuration
- Domain filtering active in production (requests only accepted from filokiapi.architectaiagency.com)
- CORS configured to work with the allowed domain
- No API tokens or authentication required

## API Structure
All APIs are accessible at `/api/*` and return responses in this format:
```json
{
  "success": true/false,
  "data": {},
  "message": "Response message"
}
```

## User Preferences
- Language: Turkish (maintain Turkish in API responses and messages)
- Authentication: None (removed per request)
- Domain restriction: filokiapi.architectaiagency.com only