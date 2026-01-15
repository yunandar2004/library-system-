const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: { type: String, default: "user" },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  image: { type: String, default: "default-avatar.png" },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
