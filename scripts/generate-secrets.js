#!/usr/bin/env node

/**
 * Secret Generation Script for Fleet Management System
 * 
 * This script generates secure random secrets for JWT and Session tokens
 * Run with: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

// Function to generate a secure random string
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

// Function to generate an API key with prefix
function generateApiKey(prefix = 'ak') {
  const timestamp = new Date().getFullYear();
  const randomPart = crypto.randomBytes(12).toString('hex');
  return `${prefix}_${timestamp}_${randomPart}`;
}

console.log('🔐 Fleet Management System - Secret Generator\n');
console.log('Generated secure secrets for your environment:\n');
console.log('='.repeat(60));

// Generate JWT Secret
const jwtSecret = generateSecret(32);
console.log('JWT_SECRET=' + jwtSecret);
console.log('# Length:', jwtSecret.length, 'characters\n');

// Generate Session Secret
const sessionSecret = generateSecret(32);
console.log('SESSION_SECRET=' + sessionSecret);
console.log('# Length:', sessionSecret.length, 'characters\n');

// Generate API Key
const apiKey = generateApiKey();
console.log('DEFAULT_API_KEY=' + apiKey);
console.log('# Format: prefix_year_randomhex\n');

console.log('='.repeat(60));
console.log('\n📋 Instructions:');
console.log('1. Copy these values to your .env file');
console.log('2. Never share or commit these secrets');
console.log('3. Generate new secrets for each environment');
console.log('4. Store production secrets securely\n');

console.log('⚠️  Security Notes:');
console.log('- These are cryptographically secure random values');
console.log('- JWT_SECRET is used for signing authentication tokens');
console.log('- SESSION_SECRET is used for session management');
console.log('- API_KEY is used for API authentication\n');