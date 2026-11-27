require("dotenv").config();

const bcrypt = require("bcryptjs");

const DEMO_ACCOUNT_COUNT = 50;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const demoGivenNames = ["Aira", "Nico", "Sinta", "Elian", "Mavi", "Tala", "Inigo", "Celine", "Rafi", "Luna"];
const demoFamilyNames = ["Abad", "Bautista", "Cabrera", "Domingo", "Enriquez"];

const scenarios = [
    {
        category: "Flood",
        incident: "Floodwater entered a ground-floor home",
        incidentDescription: "Synthetic report of rising water affecting a demo home.",
        requestType: "Rescue",
        assistance: "Demo-only request for evacuation transport from a flooded test location.",
        urgency: "Urgent",
        reliefItems: [["Drinking water", 2], ["Shelter", 1]],
        reliefNotes: "Demo-only request for temporary shelter and clean water.",
    },
    {
        category: "Road accident",
        incident: "Two-vehicle collision near a test intersection",
        incidentDescription: "Synthetic road-safety report; no real people or vehicles are involved.",
        requestType: "Medical",
        assistance: "Demo-only request for a first-aid assessment after a simulated road collision.",
        urgency: "Life-threatening",
        reliefItems: [["Medicine", 1], ["Drinking water", 1]],
        reliefNotes: "Demo-only request for basic medical supplies and drinking water.",
    },
    {
        category: "Fire",
        incident: "Kitchen fire caused smoke damage in a demo home",
        incidentDescription: "Synthetic fire report for testing shelter and response workflows.",
        requestType: "Rescue",
        assistance: "Demo-only request for a safety check and temporary shelter after a simulated fire.",
        urgency: "Urgent",
        reliefItems: [["Shelter", 1], ["Clothing", 2]],
        reliefNotes: "Demo-only request for temporary shelter and replacement clothing.",
    },
    {
        category: "Landslide",
        incident: "Landslide blocked access to a demo residence",
        incidentDescription: "Synthetic report of an impassable route near a test location.",
        requestType: "Rescue",
        assistance: "Demo-only request for a safe route and evacuation coordination.",
        urgency: "Urgent",
        reliefItems: [["Food", 3], ["Drinking water", 3]],
        reliefNotes: "Demo-only request for food and water while access is blocked.",
    },
    {
        category: "Earthquake",
        incident: "Cracked walls reported after simulated ground shaking",
        incidentDescription: "Synthetic earthquake-damage report for moderation testing.",
        requestType: "Other",
        assistance: "Demo-only request for a building safety check and temporary shelter.",
        urgency: "Normal",
        reliefItems: [["Shelter", 1], ["Hygiene", 2]],
        reliefNotes: "Demo-only request for shelter and hygiene supplies.",
    },
    {
        category: "Severe weather",
        incident: "Fallen tree blocked a demo neighborhood access road",
        incidentDescription: "Synthetic severe-weather report of a blocked test route.",
        requestType: "Rescue",
        assistance: "Demo-only request for help reaching a safe meeting point.",
        urgency: "Urgent",
        reliefItems: [["Food", 2], ["Drinking water", 2]],
        reliefNotes: "Demo-only request for food and water during a route closure.",
    },
    {
        category: "Medical emergency",
        incident: "Heat-related illness reported at a demo location",
        incidentDescription: "Synthetic health-response scenario; it is not a real medical case.",
        requestType: "Medical",
        assistance: "Demo-only request for a health check and transport to a test clinic.",
        urgency: "Life-threatening",
        reliefItems: [["Medicine", 1], ["Drinking water", 2]],
        reliefNotes: "Demo-only request for medicine and drinking water.",
    },
    {
        category: "Water safety",
        incident: "Possible water contamination reported in a test area",
        incidentDescription: "Synthetic public-health report for response queue testing.",
        requestType: "Relief Goods",
        assistance: "Demo-only request for safe drinking water and hygiene supplies.",
        urgency: "Urgent",
        reliefItems: [["Drinking water", 4], ["Hygiene", 2]],
        reliefNotes: "Demo-only request for clean water and hygiene supplies.",
    },
    {
        category: "Displacement",
        incident: "A demo household relocated during a weather advisory",
        incidentDescription: "Synthetic displacement report for evacuation and relief workflows.",
        requestType: "Relief Goods",
        assistance: "Demo-only request for infant supplies and food after a simulated relocation.",
        urgency: "Normal",
        reliefItems: [["Infant supplies", 2], ["Food", 2]],
        reliefNotes: "Demo-only request for infant supplies and food.",
    },
    {
        category: "Evacuation access",
        incident: "A demo resident needs accessible evacuation assistance",
        incidentDescription: "Synthetic accessibility scenario for testing inclusive response needs.",
        requestType: "Rescue",
        assistance: "Demo-only request for accessible evacuation transport and shelter.",
        urgency: "Urgent",
        reliefItems: [["Shelter", 1], ["Medicine", 1], ["Clothing", 1]],
        reliefNotes: "Demo-only request for accessible shelter and basic supplies.",
    },
];

const assistanceStatuses = ["Pending", "Accepted", "In Progress", "Completed", "Rejected"];
const reliefStatuses = ["Pending", "Verified", "Distributed", "Rejected"];
const supportCategories = ["Technical issue", "Password/access help", "Complaint", "Other"];
const supportStatuses = ["Open", "In Progress", "Resolved"];

function createDemoRecords(now = new Date()) {
    return Array.from({ length: DEMO_ACCOUNT_COUNT }, (_, index) => {
        const number = index + 1;
        const label = String(number).padStart(3, "0");
        const scenario = scenarios[index % scenarios.length];
        const fullName = `${demoGivenNames[index % demoGivenNames.length]} ${demoFamilyNames[Math.floor(index / demoGivenNames.length)]} (Demo)`;
        const barangay = `Demo Barangay ${String((index % 10) + 1).padStart(2, "0")}`;
        const location = `Test Location ${label}, ${barangay}`;
        const phone = `TEST-ONLY-${label}`;

        return {
            user: {
                fullName,
                email: `demo.resq.${label}@example.test`,
                phone,
                address: location,
                currentLocation: location,
                emergencyContactName: `Demo Contact ${label}`,
                emergencyContactPhone: `TEST-ONLY-CONTACT-${label}`,
            },
            incident: {
                title: `DEMO: ${scenario.incident}`,
                description: `${scenario.incidentDescription} Synthetic record ${label}; not a real event.`,
                category: scenario.category,
                location,
                barangay,
                incidentAt: new Date(now.getTime() - index * DAY_IN_MILLISECONDS),
                status: "Unverified - Evidence Pending",
            },
            assistance: {
                requestType: scenario.requestType,
                description: scenario.assistance,
                location,
                barangay,
                contactNumber: phone,
                urgency: scenario.urgency,
                status: assistanceStatuses[index % assistanceStatuses.length],
            },
            relief: index % 2 === 0 ? {
                householdSize: (index % 6) + 1,
                location,
                barangay,
                contactNumber: phone,
                notes: scenario.reliefNotes,
                status: reliefStatuses[(index / 2) % reliefStatuses.length],
                items: scenario.reliefItems.map(([category, quantity]) => ({ category, quantity })),
            } : null,
            support: index % 5 === 0 ? {
                category: supportCategories[(index / 5) % supportCategories.length],
                subject: `DEMO: Help request ${label}`,
                message: "Synthetic support request for testing. No real credentials or personal details are included.",
                status: supportStatuses[(index / 5) % supportStatuses.length],
            } : null,
        };
    });
}

function validateEnvironment() {
    if (process.env.SEED_DEMO_DATA !== "1") {
        throw new Error("Set SEED_DEMO_DATA=1 to confirm that this local demo seed should run.");
    }
    if ((process.env.NODE_ENV || "").toLowerCase() === "production") {
        throw new Error("Demo data cannot be seeded when NODE_ENV is production.");
    }

    const host = (process.env.DB_HOST || "localhost").toLowerCase().replace(/^\[|\]$/g, "");
    const database = process.env.DB_NAME || "resq_ko_mahal_ko";
    if (!["localhost", "127.0.0.1", "::1"].includes(host) || database !== "resq_ko_mahal_ko") {
        throw new Error("Demo data seeding is restricted to the local resq_ko_mahal_ko database.");
    }

    const password = process.env.DEMO_USER_PASSWORD || "";
    const passwordBytes = Buffer.byteLength(password, "utf8");
    if (passwordBytes < 12 || passwordBytes > 72) {
        throw new Error("Set DEMO_USER_PASSWORD to a test password between 12 and 72 UTF-8 bytes.");
    }
    return password;
}

async function seedDemoData() {
    const password = validateEnvironment();
    const db = require("../config/db");
    let connection;

    try {
        connection = await db.getConnection();
        const requiredTables = [
            "users",
            "incident_reports",
            "assistance_requests",
            "relief_requests",
            "relief_request_items",
            "support_tickets",
        ];
        const placeholders = requiredTables.map(() => "?").join(",");
        const [tableRows] = await connection.execute(
            `SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${placeholders})`,
            requiredTables,
        );
        const presentTables = new Set(tableRows.map(row => row.TABLE_NAME));
        const missingTables = requiredTables.filter(table => !presentTables.has(table));
        if (missingTables.length) {
            throw new Error(`Missing required tables: ${missingTables.join(", ")}. Import the database and run npm run migrate:admin-workflows first.`);
        }

        const records = createDemoRecords();
        const emails = records.map(record => record.user.email);
        const emailPlaceholders = emails.map(() => "?").join(",");
        const [existingUsers] = await connection.execute(
            `SELECT email FROM users WHERE email IN (${emailPlaceholders})`,
            emails,
        );
        if (existingUsers.length) {
            throw new Error("Some demo account emails already exist. No records were changed; remove the previous demo dataset before trying again.");
        }

        const passwordHash = await bcrypt.hash(password, 12);
        await connection.beginTransaction();
        try {
            for (const record of records) {
                const [userResult] = await connection.execute(
                    "INSERT INTO users (full_name,email,phone,address,current_location,emergency_contact_name,emergency_contact_phone,password,role) VALUES (?,?,?,?,?,?,?,?, 'user')",
                    [
                        record.user.fullName,
                        record.user.email,
                        record.user.phone,
                        record.user.address,
                        record.user.currentLocation,
                        record.user.emergencyContactName,
                        record.user.emergencyContactPhone,
                        passwordHash,
                    ],
                );

                await connection.execute(
                    "INSERT INTO incident_reports (user_id,title,description,category,location,barangay,incident_at,status) VALUES (?,?,?,?,?,?,?,?)",
                    [
                        userResult.insertId,
                        record.incident.title,
                        record.incident.description,
                        record.incident.category,
                        record.incident.location,
                        record.incident.barangay,
                        record.incident.incidentAt,
                        record.incident.status,
                    ],
                );
                await connection.execute(
                    "INSERT INTO assistance_requests (user_id,request_type,description,location,barangay,contact_number,urgency,status,admin_notes) VALUES (?,?,?,?,?,?,?,?,?)",
                    [
                        userResult.insertId,
                        record.assistance.requestType,
                        record.assistance.description,
                        record.assistance.location,
                        record.assistance.barangay,
                        record.assistance.contactNumber,
                        record.assistance.urgency,
                        record.assistance.status,
                        record.assistance.status === "Pending" ? null : "DEMO ONLY: sample workflow status.",
                    ],
                );

                if (record.relief) {
                    const [reliefResult] = await connection.execute(
                        "INSERT INTO relief_requests (user_id,household_size,location,barangay,contact_number,notes,status) VALUES (?,?,?,?,?,?,?)",
                        [
                            userResult.insertId,
                            record.relief.householdSize,
                            record.relief.location,
                            record.relief.barangay,
                            record.relief.contactNumber,
                            record.relief.notes,
                            record.relief.status,
                        ],
                    );
                    for (const item of record.relief.items) {
                        await connection.execute(
                            "INSERT INTO relief_request_items (request_id,category,quantity) VALUES (?,?,?)",
                            [reliefResult.insertId, item.category, item.quantity],
                        );
                    }
                }

                if (record.support) {
                    await connection.execute(
                        "INSERT INTO support_tickets (user_id,category,subject,message,status,admin_reply) VALUES (?,?,?,?,?,?)",
                        [
                            userResult.insertId,
                            record.support.category,
                            record.support.subject,
                            record.support.message,
                            record.support.status,
                            record.support.status === "Resolved" ? "DEMO ONLY: sample support response." : null,
                        ],
                    );
                }
            }
            await connection.commit();
        } catch (error) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Demo seed rollback failed:", rollbackError.message);
            }
            throw error;
        }

        console.log("Created 50 synthetic demo accounts, incident reports, and assistance requests; relief and support examples were also added.");
        console.log("All demo accounts use the DEMO_USER_PASSWORD value supplied for this run.");
    } finally {
        connection?.release();
        await db.end();
    }
}

if (require.main === module) {
    seedDemoData().catch(error => {
        console.error("Demo data seed failed:", error.message);
        process.exitCode = 1;
    });
}

module.exports = { createDemoRecords };
