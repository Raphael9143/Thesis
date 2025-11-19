const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Optional auth: if Authorization header exists and is valid, set req.user; otherwise proceed.
module.exports = (req, res, next) => {
  try {
    const header = req.headers.authorization || req.headers.Authorization;
    if (!header) return next();

    const parts = String(header).split(" ");
    if (parts.length !== 2) return next();
    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme) || !token) return next();

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (e) {
    console.error("tryAuth middleware error:", e);
  } finally {
    next();
  }
};
