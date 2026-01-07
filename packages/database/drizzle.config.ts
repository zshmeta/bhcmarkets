import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/schema/index.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgresql://bhcm:bhcm@100.100.13.10:5432/bhcmarkets",
    },
});
