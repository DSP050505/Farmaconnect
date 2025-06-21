const { Pool } = require('pg');

// Check if the environment is production
const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
};

// Add SSL configuration only when in production
if (isProduction) {
  connectionConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(connectionConfig);

module.exports = pool; 