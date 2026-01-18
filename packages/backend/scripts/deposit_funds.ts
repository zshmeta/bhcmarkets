/**
 * Deposit funds for a user.
 * Usage: bun run scripts/deposit_funds.ts <userId> <amount> [currency]
 */
import { createPgPool, createDrizzleClient, accounts } from "@repo/database";
import { loadEnv } from "../src/config/env.js";
import { eq, and, sql } from "drizzle-orm";

async function main() {
    const userId = process.argv[2];
    const amount = process.argv[3] || "10000";
    const currency = process.argv[4] || "USD";

    if (!userId) {
        console.error("Usage: bun run scripts/deposit_funds.ts <userId> [amount] [currency]");
        console.error("Example: bun run scripts/deposit_funds.ts dc4bdaac-ba75-40f1-a426-c653cb979cc2 10000 USD");
        process.exit(1);
    }

    const config = loadEnv();
    const pool = createPgPool({ connectionString: config.databaseUrl });
    const db = createDrizzleClient(pool);

    console.log(`Depositing ${amount} ${currency} for user ${userId}...`);

    // Find the account
    const result = await db.select().from(accounts).where(
        and(
            eq(accounts.userId, userId),
            eq(accounts.currency, currency)
        )
    ).limit(1);

    const account = result[0];

    if (!account) {
        console.error(`No ${currency} account found for user ${userId}`);
        console.log("Creating account...");

        // Create account with initial balance
        await db.insert(accounts).values({
            userId,
            currency,
            balance: amount,
            locked: "0",
        });
        console.log(`Created ${currency} account with balance ${amount}`);
    } else {
        // Update balance
        const newBalance = (parseFloat(account.balance) + parseFloat(amount)).toString();
        await db.update(accounts)
            .set({
                balance: newBalance,
                updatedAt: new Date()
            })
            .where(eq(accounts.id, account.id));
        console.log(`Updated balance: ${account.balance} -> ${newBalance} ${currency}`);
    }

    await pool.end();
    console.log("Done!");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
