import bcrypt from 'bcryptjs';

// Test API key
const apiKey = 'ak_prod2025_rwba6dj1sw';

// Generate hash
const saltRounds = 10;
const hash = bcrypt.hashSync(apiKey, saltRounds);

console.log('API Key:', apiKey);
console.log('Hash:', hash);
console.log('\nProduction SQL:');
console.log(`
-- Production'da çalıştırılacak SQL
UPDATE api_keys 
SET key_hash = '${hash}' 
WHERE client_id = (SELECT id FROM api_clients WHERE name = 'Production Main API');
`);

// Verify
console.log('Verification:', bcrypt.compareSync(apiKey, hash));