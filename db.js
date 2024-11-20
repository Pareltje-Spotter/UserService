const { Pool } = require('pg');

// Configure the PostgreSQL client
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  user: 'user',
  password: 'admin',
  database: 'userinfo',
});

module.exports = pool;