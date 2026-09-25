const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function initializeDatabase() {
  console.log('Connecting to MySQL server...');
  
  // Connect without database first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    multipleStatements: true
  });

  try {
    const dbName = process.env.DB_NAME || 'support_tickets';
    console.log(`Ensuring database "${dbName}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('Executing database/schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('Schema created successfully.');
    }

    if (fs.existsSync(seedPath)) {
      console.log('Executing database/seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('Seed data inserted successfully.');
    }

    console.log(`\n🎉 Database "${dbName}" is initialized and ready to use!`);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initializeDatabase();