const assert = require("node:assert/strict");
const test = require("node:test");
const { createDemoRecords } = require("./seedDemoData");

test("builds 50 fictional accounts with varied incident and support needs", () => {
    const records = createDemoRecords(new Date("2026-11-27T00:00:00.000Z"));

    assert.equal(records.length, 50);
    assert.equal(new Set(records.map(record => record.user.email)).size, 50);
    assert.equal(new Set(records.map(record => record.user.fullName)).size, 50);
    assert.ok(records.every(record => record.user.fullName.endsWith("(Demo)")));
    assert.ok(records.every(record => record.user.email.endsWith("@example.test")));
    assert.ok(records.every(record => record.user.phone.startsWith("TEST-ONLY-")));
    assert.equal(new Set(records.map(record => record.incident.category)).size, 10);
    assert.ok(records.every(record => record.incident.status === "Unverified - Evidence Pending"));
    assert.equal(records.filter(record => record.relief).length, 25);
    assert.equal(records.filter(record => record.support).length, 10);
    assert.ok(records.every(record => ["Medical", "Rescue", "Relief Goods", "Other"].includes(record.assistance.requestType)));
    assert.ok(records.every(record => ["Normal", "Urgent", "Life-threatening"].includes(record.assistance.urgency)));
    assert.ok(records.filter(record => record.relief).flatMap(record => record.relief.items).every(item =>
        ["Food", "Drinking water", "Medicine", "Hygiene", "Infant supplies", "Shelter", "Clothing", "Other"].includes(item.category)
    ));
    assert.ok(records.filter(record => record.support).every(record =>
        ["Complaint", "Technical issue", "Password/access help", "Other"].includes(record.support.category)
    ));
});
