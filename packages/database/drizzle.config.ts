/// <reference types="node" />
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    // The repo uses `moduleResolution: NodeNext` and `.js` extensions in TS
    // imports (so emitted JS runs under Node ESM). drizzle-kit loads the schema
    // via CJS `require`, so it must read the compiled output where those `.js`
    // files exist.
    schema: "./dist/schema/index.js",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgresql://bhcm:bhcm@100.100.13.10:5432/bhcmarkets",
    },
});
