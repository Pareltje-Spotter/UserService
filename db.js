const { Pool } = require('pg');
require('dotenv').config();

// Configure the PostgreSQL client
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: 5432,
    user: process.env.POSTGRES_USER ,
    password: process.env.POSTGRES_PASSWORD ,
    database: process.env.POSTGRES_DB ,
});

module.exports = pool;

// const pool = new Pool({
//     host: 'localhost',
//     port: 5432,
//     user: 'user',
//     password: 'admin',
//     database: 'userinfo',
//   });
//   module.exports = pool;