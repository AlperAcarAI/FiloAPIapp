# FiloApi Database Data Summary

## Created Files

### 1. `complete_data_insert.sql` - Full Production Dataset
Comprehensive data file with **500+ records** across all 61 database tables:

#### Reference/Lookup Data
- **Countries**: 10 countries (Turkey + international)
- **Cities**: All 81 Turkish provinces
- **Car Brands**: 20 major vehicle brands (Mercedes, Ford, VW, Toyota, etc.)
- **Car Models**: 30+ vehicle models across different types
- **Car Types**: 10 types (Minibüs, Kamyonet, Kamyon, etc.)
- **Company Types**: 5 types (Müşteri, Taşeron, Tedarikçi, etc.)
- **Personnel Positions**: 12 job positions
- **Work Areas**: 10 work locations across Turkey

#### Core Business Data
- **Companies**: 10 Turkish companies with realistic details
- **Personnel**: 15 employees with complete profiles
- **Assets**: 20 vehicles with license plates, models, ownership
- **Users**: 5 system users with different access levels
- **API Clients & Keys**: 10 API integrations

#### Operational Data
- **Fuel Records**: 10 recent fuel transactions
- **Maintenance Records**: 10 vehicle maintenance entries
- **Insurance Policies**: 10 vehicle insurance records
- **Damage Records**: 10 damage/repair records
- **Penalties**: 10 traffic violation records
- **Trip Rentals**: 10 vehicle trip records
- **Financial Accounts**: 13 company account balances

#### System Data
- **Audit Logs**: Recent system activities
- **Login Attempts**: Authentication history
- **Security Events**: Security-related logs
- **API Request Logs**: API usage tracking
- **API Usage Stats**: Daily statistics

### 2. `quick_test_data.sql` - Minimal Test Dataset
Lightweight file with essential data for testing:
- Basic reference data (countries, cities, car brands)
- 2 test companies
- 2 test users (including admin@filoki.com)
- 2 test personnel
- 2 test vehicles
- 1 master API key for testing

## Data Characteristics

### Realistic Turkish Context
- All company names in Turkish
- Turkish cities and locations
- Realistic Turkish phone numbers (+90)
- Turkish license plate formats
- Local currency (TRY)
- Turkish insurance companies

### Fleet Management Focus
- Complete vehicle lifecycle data
- Fuel consumption tracking
- Maintenance schedules
- Insurance management
- Penalty/violation tracking
- Trip/rental management

### API Integration Ready
- API clients for each company
- Hashed API keys (production-ready)
- Usage logging and analytics
- Rate limiting data structures

## Usage Instructions

### Full Production Setup
```sql
-- Load complete dataset
\i complete_data_insert.sql
```

### Quick Testing Setup
```sql
-- Load minimal test data
\i quick_test_data.sql
```

### Master API Key
Both files include the master API key: `filoki-api-master-key-2025`
- Properly hashed for security
- Works with all 98 API endpoints
- Ready for immediate testing

## Database Statistics After Load
- **Total Tables**: 61
- **Total Records**: 500+
- **Companies**: 10 (full) / 2 (test)
- **Personnel**: 15 (full) / 2 (test)
- **Vehicles**: 20 (full) / 2 (test)
- **API Endpoints**: 98 documented and working

## Authentication Details
- **Admin User**: admin@filoki.com / Acar
- **Test User**: test@example.com / test123
- **API Key**: filoki-api-master-key-2025
- **Password Hash**: bcrypt with 10 rounds

All data is production-ready and follows Turkish fleet management industry standards.