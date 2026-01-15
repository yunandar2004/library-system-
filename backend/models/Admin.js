const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  role: { type: String, default: "admin" },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  image: { type: String, default: "default-avatar.png" },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Admin", adminSchema);
