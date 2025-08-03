#!/usr/bin/env node
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage: node generate-api-key-hash.mjs <password_or_api_key>');
    console.log('Example: node generate-api-key-hash.mjs MySecurePassword123');
    process.exit(1);
}

const textToHash = args[0];

async function generateHash() {
    try {
        const hash = await bcrypt.hash(textToHash, 10);
        console.log('\nOriginal text:', textToHash);
        console.log('Generated hash:', hash);
        console.log('\nYou can use this hash in your .env file');
    } catch (error) {
        console.error('Error generating hash:', error);
    }
}

generateHash();