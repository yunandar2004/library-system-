const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

exports.protect = async (req, res, next) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Not authorized, token missing" });
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch admin from DB and exclude password
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ error: "Not authorized, admin not found" });
    }
    req.user = admin;
    next();
  } catch (err) {
    console.error("AuthMiddleware Error:", err.message);
    return res.status(401).json({ error: "Not authorized, token invalid" });
  }
};


exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admins only" });
  }
  next();
};
