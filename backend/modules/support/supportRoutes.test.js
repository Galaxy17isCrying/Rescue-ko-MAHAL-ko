const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const supportRoutes = require("./supportRoutes");

const testSecret = "support-workflow-test-secret-must-be-longer-than-32-characters";

test("support routes require authentication and validate user/admin actions", async (t) => {
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = testSecret;
    const app = express();
    app.use(express.json());
    app.use("/api/support", supportRoutes);

    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.once("listening", resolve);
    });
    t.after(async () => {
        if (originalSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = originalSecret;
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}/api/support`;
    const userToken = jwt.sign({ id: 8, role: "user" }, testSecret);
    const adminToken = jwt.sign({ id: 9, role: "admin" }, testSecret);
    const unauthenticated = await fetch(baseUrl);
    assert.equal(unauthenticated.status, 401);

    const userHeaders = { authorization: `Bearer ${userToken}`, "content-type": "application/json" };
    const adminHeaders = { authorization: `Bearer ${adminToken}`, "content-type": "application/json" };
    const invalidRequest = await fetch(baseUrl, {
        method: "POST",
        headers: userHeaders,
        body: JSON.stringify({ category: "Other", subject: "", message: "" }),
    });
    assert.equal(invalidRequest.status, 400);

    const adminSubmission = await fetch(baseUrl, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ category: "Other", subject: "Not a user request", message: "Invalid role." }),
    });
    assert.equal(adminSubmission.status, 403);

    const userUpdate = await fetch(`${baseUrl}/1`, {
        method: "PATCH",
        headers: userHeaders,
        body: JSON.stringify({ status: "Resolved", adminReply: "Not allowed." }),
    });
    assert.equal(userUpdate.status, 403);

    const invalidAdminUpdate = await fetch(`${baseUrl}/invalid`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ status: "Resolved", adminReply: "" }),
    });
    assert.equal(invalidAdminUpdate.status, 400);
});
