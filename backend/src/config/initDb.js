const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function initializeDatabase() {
  console.log('Connecting to MySQL server at ' + (process.env.DB_HOST || 'localhost') + '...');

  const isCloud = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';
  const targetDb = process.env.DB_NAME || 'support_tickets';

  // For cloud databases (Aiven/Railway), connect directly to the assigned database
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    multipleStatements: true,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined
  };

  if (isCloud) {
    connectionConfig.database = targetDb;
  }

  const connection = await mysql.createConnection(connectionConfig);

  try {
    if (!isCloud) {
      console.log(`Ensuring database "${targetDb}" exists...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\`;`);
      await connection.query(`USE \`${targetDb}\`;`);
    } else {
      console.log(`Connected to cloud database "${targetDb}".`);
    }

    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('Executing database/schema.sql...');
      let schemaSql = fs.readFileSync(schemaPath, 'utf8');
      if (isCloud) {
        // Only strip out CREATE DATABASE and USE statements (with whole word boundary)
        schemaSql = schemaSql.replace(/^\s*CREATE\s+DATABASE\s+[^;]+;/gim, '').replace(/^\s*USE\s+[^;]+;/gim, '');
      }
      await connection.query(schemaSql);
      console.log('Schema created successfully.');
    }

    if (fs.existsSync(seedPath)) {
      console.log('Executing database/seed.sql...');
      let seedSql = fs.readFileSync(seedPath, 'utf8');
      if (isCloud) {
        seedSql = seedSql.replace(/^\s*USE\s+[^;]+;/gim, '');
      }
      await connection.query(seedSql);
      console.log('Seed data inserted successfully.');
    }

    console.log(`\n🎉 Database "${targetDb}" is initialized and ready to use!`);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initializeDatabase();