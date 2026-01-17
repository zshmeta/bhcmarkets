
import postgres from 'postgres';

// Hardcoded default found in .env
const connectionString = process.env.DATABASE_URL || 'postgresql://bhcm:bhcm@100.100.13.10:5432/bhcmarkets';

const sql = postgres(connectionString);

async function main() {
    console.log('🔌 Connecting to database...');
    try {
        // 1. Check if table exists
        console.log('🔍 Checking market_prices table...');
        const table = await sql`SELECT to_regclass('public.market_prices')::text`;
        if (!table[0].to_regclass) {
            console.error('❌ Table market_prices does not exist. Please run seed first.');
            process.exit(1);
        }

        // 2. Remove duplicates
        console.log('🧹 Removing duplicates...');
        await sql`
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
        console.log('✅ Duplicates removed.');

        // 3. Add Unique Index
        console.log('🛠️ Creating unique index...');
        await sql`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_market_prices_symbol_timestamp 
            ON market_prices (symbol, timestamp)
        `;
        console.log('✅ Unique index uq_market_prices_symbol_timestamp created.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await sql.end();
        console.log('👋 Done.');
        process.exit(0);
    }
}

main();
