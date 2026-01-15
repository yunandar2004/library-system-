const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

// Register (default role = user)
exports.register = async (req, res) => {
  try {
    // ✅ First destructure from req.body
    const { name, email, password, phone } = req.body;

    // ✅ Now you can safely use email
    const bannedAccount = await User.findOne({ email });
    if (bannedAccount && bannedAccount.isBanned) {
      return res.status(403).json({ error: "This email is banned" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({ name, email, password: hashedPassword, phone });
    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login (user or admin)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let account =
      (await User.findOne({ email })) || (await Admin.findOne({ email }));
    if (!account) return res.status(404).json({ error: "Account not found" });

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    if (account.isBanned) {
      return res.status(403).json({ error: "Account is banned" });
    }
    if (!account.isActive) {
      return res.status(403).json({ error: "Account is inactive" });
    }

    const token = jwt.sign(
      { id: account._id, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token, account });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
