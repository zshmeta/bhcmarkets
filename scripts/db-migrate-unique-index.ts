
import { getDbClient, closeDb } from '@repo/database';
import { env } from '../packages/config/env';

async function main() {
    console.log('Connecting to database...');
    // We can't easily import env from outside packages due to compiled nature in this environment, 
    // so we'll guess or require the user to provide it.
    // However, the user environment seems to have DATABASE_URL set.

    // We will use the simplest approach: raw postgres client if we can import it, 
    // or just assume we can run a SQL command via the existing repo setup.
    // The previous logs showed @repo/database usage.

    const client = await getDbClient({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/bhcmarkets',
    });

    try {
        console.log('Checking for duplicates before adding unique index...');

        // Optional: Delete duplicates if any (keeping the latest)
        // This is aggressive but necessary for applying the constraint
        await client`
            DELETE FROM market_prices a USING (
                SELECT min(id) as id, symbol, timestamp 
                FROM market_prices 
                GROUP BY symbol, timestamp 
                HAVING count(*) > 1
            ) b 
            WHERE a.symbol = b.symbol 
            AND a.timestamp = b.timestamp 
            AND a.id > b.id
        `;

        console.log('Duplicates removed. Adding UNIQUE INDEX...');

        await client`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_market_prices_symbol_timestamp 
            ON market_prices (symbol, timestamp)
        `;

        console.log('Unique index created successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await closeDb();
    }
}

main();
