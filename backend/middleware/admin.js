function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  const supplied = req.get("x-admin-key");

  if (!expected) {
    return res.status(503).json({ message: "Admin access is not configured on the server." });
  }

  if (!supplied || supplied !== expected) {
    return res.status(401).json({ message: "Invalid admin credentials." });
  }

  next();
}

module.exports = { requireAdmin };
