const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");
const router = require("./aiChatRoutes");

test("retries Gemini once after a transient 503", async (t) => {
  const nativeFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  let providerCalls = 0;
  process.env.GEMINI_API_KEY = "unit-test-gemini-api-key";
  global.fetch = async () => {
    providerCalls += 1;
    if (providerCalls === 1) {
      return new Response(JSON.stringify({ error: { status: "UNAVAILABLE" } }), {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: "Drop, Cover, and Hold On." }] } }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  const app = express();
  app.use(express.json());
  app.use("/api/ai-chat", router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.once("listening", resolve);
  });

  t.after(async () => {
    global.fetch = nativeFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const { port } = server.address();
  const response = await nativeFetch(`http://127.0.0.1:${port}/api/ai-chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "Earthquake tips" }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.reply, "Drop, Cover, and Hold On.");
  assert.equal(providerCalls, 2);
});
