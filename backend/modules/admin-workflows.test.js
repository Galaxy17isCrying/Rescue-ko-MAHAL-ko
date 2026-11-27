const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/auth");
const adminRoutes = require("../routes/admin");
const announcementRoutes = require("./announcements/announcementRoutes");
const reliefRequestRoutes = require("./relief/reliefRequestRoutes");

const testSecret = "admin-workflows-test-secret-must-be-longer-than-32-characters";

test("admin workflow routes enforce authentication, role, and input validation", async (t) => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = testSecret;
    const app = express();
    app.use(express.json());
    app.use("/api/admin", adminRoutes);
    app.use("/api/relief-requests", verifyToken, reliefRequestRoutes);
    app.use("/api/announcements", announcementRoutes);

    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.once("listening", resolve);
    });
    t.after(async () => {
        if (originalSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = originalSecret;
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const userToken = jwt.sign({ id: 8, role: "user" }, testSecret);
    const adminToken = jwt.sign({ id: 9, role: "admin" }, testSecret);
    const asUser = { authorization: `Bearer ${userToken}`, "content-type": "application/json" };
    const asAdmin = { authorization: `Bearer ${adminToken}`, "content-type": "application/json" };

    const unauthenticated = await fetch(`${baseUrl}/api/relief-requests`);
    assert.equal(unauthenticated.status, 401);

    const userDashboardCharts = await fetch(`${baseUrl}/api/admin/charts`, { headers: asUser });
    assert.equal(userDashboardCharts.status, 403);

    const userStatusChange = await fetch(`${baseUrl}/api/relief-requests/4/status`, {
        method: "PATCH",
        headers: asUser,
        body: JSON.stringify({ status: "Verified" }),
    });
    assert.equal(userStatusChange.status, 403);

    const invalidReliefRequest = await fetch(`${baseUrl}/api/relief-requests`, {
        method: "POST",
        headers: asUser,
        body: JSON.stringify({}),
    });
    assert.equal(invalidReliefRequest.status, 400);

    const userAnnouncement = await fetch(`${baseUrl}/api/announcements`, {
        method: "POST",
        headers: asUser,
        body: JSON.stringify({ title: "Not allowed" }),
    });
    assert.equal(userAnnouncement.status, 403);

    const invalidAdminAnnouncement = await fetch(`${baseUrl}/api/announcements`, {
        method: "POST",
        headers: asAdmin,
        body: JSON.stringify({ status: "Draft" }),
    });
    assert.equal(invalidAdminAnnouncement.status, 400);

    const expiredAnnouncement = await fetch(`${baseUrl}/api/announcements`, {
        method: "POST",
        headers: asAdmin,
        body: JSON.stringify({
            title: "Expired notice",
            body: "This should not be published.",
            source_name: "Test source",
            status: "Published",
            starts_at: "2020-01-01T10:00",
            expires_at: "2020-01-02T10:00",
        }),
    });
    assert.equal(expiredAnnouncement.status, 400);
});
