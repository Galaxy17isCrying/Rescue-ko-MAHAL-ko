const app = require("../server");

module.exports = (req, res) => {
  if (!req.url.startsWith("/api/") && req.url !== "/api") {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  app(req, res);
};
