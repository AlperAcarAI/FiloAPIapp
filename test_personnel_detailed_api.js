// Test the personnel_detailed API directly
const { db } = require('./server/db.js');
const { sql } = require('drizzle-orm');

async function testPersonnelDetailedView() {
  try {
    console.log('=== Testing personnel_detailed view directly ===');
    
    // Test view directly
    const viewResult = await db.execute(sql.raw(`
      SELECT 
        personnel_id,
        personnel_name,
        personnel_surname,
        company_name,
        current_work_area_name,
        current_position_name
      FROM personnel_detailed 
      LIMIT 2
    `));
    
    console.log('View result:', viewResult.rows);
    console.log('Success: View is working!');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testPersonnelDetailedView();