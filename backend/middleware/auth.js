const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Please log in first." });
    }

    try {
        req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Your session is invalid or expired." });
    }
}

function verifyAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access only." });
    }
    next();
}

module.exports = verifyToken;
module.exports.verifyAdmin = verifyAdmin;
