const { Pool } = require('pg');

// Create a client instance and configure it with your PostgreSQL connection details
const client = new Client({
    host: 'postgres',      // This is the name of the Kubernetes service
    port: 5432,            // Default PostgreSQL port
    user: process.env.POSTGRES_USER || 'user', // Set the username (environment variable or default)
    password: process.env.POSTGRES_PASSWORD || 'admin', // Set the password (environment variable or default)
    database: process.env.POSTGRES_DB || 'userinfo', // Set the database (environment variable or default)
});

// Connect to the PostgreSQL database
client.connect()
    .then(() => {
        console.log('Connected to PostgreSQL');
    })
    .catch((err) => {
        console.error('Error connecting to PostgreSQL', err.stack);
    });

module.exports = client;