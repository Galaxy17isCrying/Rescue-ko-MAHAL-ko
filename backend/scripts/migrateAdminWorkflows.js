require("dotenv").config();

const fs = require("fs");
const path = require("path");
const db = require("../config/db");

async function main() {
    const migrationPath = path.resolve(__dirname, "../../database/migrations/20261126_admin_workflows.sql");
    const migration = fs.readFileSync(migrationPath, "utf8");
    const statements = migration.split(";").map(statement => statement.trim()).filter(Boolean);

    try {
        await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('user','admin','employee') NOT NULL DEFAULT 'user'");
        const [columns] = await db.execute(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('suspended_at','suspension_reason')",
        );
        const existingColumns = new Set(columns.map(column => column.COLUMN_NAME));
        if (!existingColumns.has("suspended_at")) {
            await db.query("ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP NULL");
        }
        if (!existingColumns.has("suspension_reason")) {
            await db.query("ALTER TABLE users ADD COLUMN suspension_reason VARCHAR(255) NULL");
        }
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
