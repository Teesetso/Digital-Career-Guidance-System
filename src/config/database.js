const { Pool } = require('pg');

// Hardcoded connection string to bypass the local .env whitespace parser bug
const connectionString = "postgresql://neondb_owner:npg_Qld2kIO4Untz@ep-autumn-shadow-as531y4z.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to Neon PostgreSQL database successfully!');
    release();
  }
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};