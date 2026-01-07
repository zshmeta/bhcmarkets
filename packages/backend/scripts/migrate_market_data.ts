// DEPRECATED: This file is broken and references non-existent paths.
// Please perform migrations using the standard mechanism in packages/database.
console.error("This script is deprecated and broken. Please use 'yarn migrate' from packages/backend.");
process.exit(1);

/*
import pg from "pg";
import fs from "fs";
import path from "path";
import { DATABASE_URL } from "../src/market-data/config.js";

const pool = new pg.Pool({ connectionString: DATABASE_URL });
*/

async function migrate() {
    console.log("Migrating market data...");
    const client = await pool.connect();
    try {
        const migrationPath = path.join(process.cwd(), "../../packages/database/migrations/001_market_data.sql");
        const sql = fs.readFileSync(migrationPath, "utf-8");
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("COMMIT");
        console.log("Migration applied successfully.");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
