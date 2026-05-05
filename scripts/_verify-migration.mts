import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { Pool } = require('../functions/node_modules/pg')

const CONN = process.env.DATABASE_URI
if (!CONN) throw new Error('DATABASE_URI env var is required')

const pool = new Pool({ connectionString: CONN, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()

const { rows: counts } = await client.query(`
  SELECT
    (SELECT count(*) FROM live_election_results) AS parent,
    (SELECT count(*) FROM live_election_results_parties) AS parties,
    (SELECT count(*) FROM election_results_2026) AS old_parent,
    (SELECT count(*) FROM election_results_2026_parties) AS old_parties
`)
console.log('live_election_results:         ', counts[0].parent, 'rows')
console.log('live_election_results_parties: ', counts[0].parties, 'rows')
console.log('election_results_2026 (old):   ', counts[0].old_parent, 'rows')
console.log('election_results_2026_parties (old):', counts[0].old_parties, 'rows')

const { rows: yearCheck } = await client.query(
  `SELECT year, count(*) FROM live_election_results GROUP BY year`,
)
console.log('\nYear breakdown:', yearCheck.map((r: any) => `${r.year}: ${r.count}`).join(', '))

const { rows: partyTally } = await client.query(`
  SELECT p.name, count(*) as seats
  FROM live_election_results_parties p
  JOIN live_election_results e ON e.id = p._parent_id
  WHERE e.state_code='TN' AND e.year=2026 AND p._order=1
  GROUP BY p.name ORDER BY seats DESC LIMIT 8
`)
console.log('\nTop parties (year=2026, TN):')
partyTally.forEach((r: any) => console.log(`  ${r.name}: ${r.seats} seats`))

client.release()
await pool.end()
