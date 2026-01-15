const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Admin = require("../models/Admin");

/* ---------------- USER MANAGEMENT ---------------- */

// List users with pagination
exports.listUsers = async (req, res) => {
  const { page = 1, limit = 10, name, email, phone } = req.query;

  // Build filter object
  let filter = {};
  if (name) filter.name = new RegExp(name, "i"); // case-insensitive match
  if (email) filter.email = new RegExp(email, "i");
  if (phone) filter.phone = new RegExp(phone, "i");

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    data: users,
  });
};

// View user detail
exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean(); // lean() gives plain JS object

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Optionally shape the response to match frontend expectations
    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      isActive: user.isActive,
      image: user.image || null,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Create user
exports.createUser = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword, phone });
  await user.save();
  res.status(201).json(user);
};

// Update user
exports.updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
};

// Delete user
exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};

// Ban user
exports.banUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBanned: true, isActive: false },
    { new: true }
  );
  res.json(user);
};
// Restore user
exports.restoreUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, isActive: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


/* ---------------- ADMIN MANAGEMENT ---------------- */

// List admins
exports.listAdmins = async (req, res) => {
  const { page = 1, limit = 10, name, email, phone, address } = req.query;

  let filter = {};
  if (name) filter.name = new RegExp(name, "i");
  if (email) filter.email = new RegExp(email, "i");
  if (phone) filter.phone = new RegExp(phone, "i");
  if (address) filter.address = new RegExp(address, "i");

  const total = await Admin.countDocuments(filter);
  const admins = await Admin.find(filter)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    data: admins,
  });
};

// View admin detail
exports.getAdminDetail = async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ error: "Admin not found" });
  res.json(admin);
};

// Create admin
exports.createAdmin = async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new Admin({
    name,
    email,
    password: hashedPassword,
    phone,
    address,
  });
  await admin.save();
  res.status(201).json(admin);
};

// Update admin
exports.updateAdmin = async (req, res) => {
  const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!admin) return res.status(404).json({ error: "Admin not found" });
  res.json(admin);
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  await Admin.findByIdAndDelete(req.params.id);
  res.json({ message: "Admin deleted" });
};

// Ban admin
exports.banAdmin = async (req, res) => {
  const admin = await Admin.findByIdAndUpdate(
    req.params.id,
    { isBanned: true, isActive: false },
    { new: true }
  );
  res.json(admin);
};

// Restore admin
exports.restoreAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, isActive: true },
      { new: true }
    );
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json(admin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// PUT /admins/:id/image
exports.updateAdminImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const admin = await Admin.findByIdAndUpdate(
    req.params.id,
    { image: req.file.path },
    { new: true }
  );

  if (!admin) return res.status(404).json({ error: "Admin not found" });

  res.json(admin);
};

