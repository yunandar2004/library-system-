const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Seed default admin if not exists
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const admin = new Admin({
        name: process.env.ADMIN_NAME || "Default Admin",
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        phone: process.env.ADMIN_PHONE || "0000000000",
        address: process.env.ADMIN_ADDRESS || "Default Address",
      });
      await admin.save();
      console.log("✅ Default admin account created");
    }
  } catch (err) {
    console.error("DB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
