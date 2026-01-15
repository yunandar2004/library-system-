const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Admin = require("../models/Admin");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

// / ---------------- Multer Setup ----------------/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/admins";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// ✅ Multer middleware to handle single image upload
const uploadAdminImage = upload.single("image");
const uploadUserImage = upload.single("image");

// Excel upload storage
const excelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/admin-excel";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `admins-${Date.now()}${ext}`);
  },
});

const excelUpload = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const allowed = [".xlsx", ".xls"];
    const ext = path.extname(file.originalname);
    if (!allowed.includes(ext))
      return cb(new Error("Only Excel files allowed"));
    cb(null, true);
  },
});

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
// ---------------- Create User ----------------
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
    };

    // Optional image upload (same as admin)
    if (req.file) {
      userData.image = req.file.path;
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
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

// Export all users as Excel
exports.exportUsers = async (req, res) => {
  try {
    const users = await User.find().lean();

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }

    // Map data for Excel
    const data = users.map((u) => ({
      Name: u.name,
      Email: u.email,
      Phone: u.phone,
      Role: u.role,
      Active: u.isActive ? "Yes" : "No",
      Banned: u.isBanned ? "Yes" : "No",
      CreatedAt: u.createdAt.toISOString(),
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Users");

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set headers and send file
    res.setHeader("Content-Disposition", 'attachment; filename="users.xlsx"');
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export users" });
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

// ---------------- Create Admin ----------------
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminData = {
      name,
      email,
      password: hashedPassword,
      phone,
      address,
    };

    if (req.file) {
      adminData.image = req.file.path; // store uploaded image path
    }

    const admin = new Admin(adminData);
    await admin.save();

    res.status(201).json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
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

// Export all admins as Excel
exports.exportAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().lean();

    if (!admins || admins.length === 0) {
      return res.status(404).json({ error: "No admins found" });
    }

    // Map data to simple objects for Excel
    const data = admins.map((a) => ({
      Name: a.name,
      Email: a.email,
      Phone: a.phone,
      Address: a.address,
      Role: a.role,
      Active: a.isActive ? "Yes" : "No",
      Banned: a.isBanned ? "Yes" : "No",
      CreatedAt: a.createdAt.toISOString(),
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Admins");

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set headers and send
    res.setHeader("Content-Disposition", 'attachment; filename="admins.xlsx"');
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export admins" });
  }
};
// Example: import admins from an Excel file
exports.importAdmins = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const admins = data.map((row) => ({
      name: row.Name,
      email: row.Email,
      phone: row.Phone,
      address: row.Address,
      password: bcrypt.hashSync(row.Password || "default123", 10),
    }));

    await Admin.insertMany(admins);
    res.json({ message: `${admins.length} admins imported successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to import admins" });
  }
};

module.exports = {
  // Users
  listUsers: exports.listUsers,
  getUserDetail: exports.getUserDetail,
  createUser: exports.createUser,
  updateUser: exports.updateUser,
  deleteUser: exports.deleteUser,
  banUser: exports.banUser,
  restoreUser: exports.restoreUser,
  exportUsers: exports.exportUsers,

  // Admins
  listAdmins: exports.listAdmins,
  getAdminDetail: exports.getAdminDetail,
  createAdmin: exports.createAdmin,
  updateAdmin: exports.updateAdmin,
  deleteAdmin: exports.deleteAdmin,
  banAdmin: exports.banAdmin,
  restoreAdmin: exports.restoreAdmin,
  exportAdmins: exports.exportAdmins,
  importAdmins: exports.importAdmins,
  // Multer middleware
  uploadAdminImage,
  uploadUserImage
};
