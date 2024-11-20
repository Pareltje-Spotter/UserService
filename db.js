const { Pool } = require('pg');

// Configure the PostgreSQL client
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'user',
  password: 'admin',
  database: 'userinfo',
});

module.exports = pool;