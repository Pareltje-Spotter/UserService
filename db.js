const { Pool } = require('pg');

// Configure the PostgreSQL client
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  user: process.env.POSTGRES_USER || 'user', // Set the username (environment variable or default)
  password: process.env.POSTGRES_PASSWORD || 'admin', // Set the password (environment variable or default)
  database: process.env.POSTGRES_DB || 'userinfo', // Set the database (environment variable or default)
});

module.exports = pool;