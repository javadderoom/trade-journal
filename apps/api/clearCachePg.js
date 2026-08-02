const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5433/trade_journal?schema=public' });
client.connect()
  .then(() => client.query('DELETE FROM "CandleCache";'))
  .then(() => { console.log('Cache cleared!'); client.end(); })
  .catch(e => { console.error('Error:', e); process.exit(1); });
