require("dotenv").config();

const readline = require("readline");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
    try {
        const fullName = await ask("Admin full name: ");
        const email = (await ask("Admin email: ")).trim();
        const password = await ask("Admin password (at least 8 characters): ");

        if (!fullName.trim() || !email || password.length < 8) {
            throw new Error("Please provide a name, email, and password with at least 8 characters.");
        }

        const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length) {
            throw new Error("An account with this email already exists.");
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await db.execute(
            "INSERT INTO users (full_name, email, phone, address, password, role) VALUES (?, ?, ?, ?, ?, 'admin')",
            [fullName.trim(), email, "N/A", "N/A", hashedPassword]
        );

        console.log("Admin account created successfully. Open /admin/login to sign in.");
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        rl.close();
        await db.end();
    }
}

main();
