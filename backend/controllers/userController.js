const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Update self (info, password, image)
exports.updateSelf = async (req, res) => {
  try {
    const updates = req.body;

    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete self
exports.deleteSelf = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
