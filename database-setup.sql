-- Fleet Management System Database Setup Script
-- This script creates the database and user for the application
-- Run this script as a PostgreSQL superuser

-- Create database
CREATE DATABASE fleet_management;

-- Create user (replace 'your_password' with a secure password)
CREATE USER fleet_user WITH PASSWORD 'your_secure_password_here';

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE fleet_management TO fleet_user;

-- Connect to the database
\c fleet_management;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO fleet_user;
GRANT CREATE ON SCHEMA public TO fleet_user;

-- Additional permissions for the user
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fleet_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fleet_user;

-- Note: After running this script, update your .env file with:
-- DATABASE_URL=postgresql://fleet_user:your_secure_password_here@localhost:5432/fleet_management