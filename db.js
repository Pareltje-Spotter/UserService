const { Pool } = require('pg');

// Configure the PostgreSQL client
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  user: 'user',
  password: 'admin',
  database: 'userinfo',
});


// host: process.env.POSTGRES_HOSTNAME || 'localhost',
// port: 5432,
// user: process.env.POSTGRES_USER || 'user', 
// password: process.env.POSTGRES_PASSWORD || 'admin', 
// database: process.env.POSTGRES_DB || 'userinfo', 
module.exports = pool;