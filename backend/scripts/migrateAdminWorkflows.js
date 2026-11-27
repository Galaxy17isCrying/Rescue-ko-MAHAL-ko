require("dotenv").config();

const fs = require("fs");
const path = require("path");
const db = require("../config/db");

async function main() {
    const migrationPath = path.resolve(__dirname, "../../database/migrations/20261126_admin_workflows.sql");
    const migration = fs.readFileSync(migrationPath, "utf8");
    const statements = migration.split(";").map(statement => statement.trim()).filter(Boolean);

    try {
        for (const statement of statements) {
            await db.query(statement);
        }
        console.log("Admin workflow tables are ready.");
    } finally {
        await db.end();
    }
}

main().catch(error => {
    console.error("Unable to apply admin workflow migration:", error.code || error.message);
    process.exitCode = 1;
});
