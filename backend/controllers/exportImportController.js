const User = require("../models/User");
const Admin = require("../models/Admin");
const Book = require("../models/Book");
const BorrowRecord = require("../models/BorrowRecord");
const XLSX = require("xlsx");

/* ----------- EXPORT ----------- */
exports.exportData = async (req, res) => {
  const { type } = req.params; // "users", "admins", "books", "borrowers"
  let data;

  switch (type) {
    case "users":
      data = await User.find().lean();
      break;
    case "admins":
      data = await Admin.find().lean();
      break;
    case "books":
      data = await Book.find().lean();
      break;
    case "borrowers":
      data = await BorrowRecord.find()
        .populate("userId", "name email")
        .populate("bookId", "name author")
        .lean();
      break;
    default:
      return res.status(400).json({ error: "Invalid export type" });
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, type);

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", `attachment; filename=${type}.xlsx`);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
};

/* ----------- IMPORT ----------- */
exports.importData = async (req, res) => {
  const { type } = req.params;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const workbook = XLSX.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  switch (type) {
    case "users":
      await User.insertMany(data);
      break;
    case "admins":
      await Admin.insertMany(data);
      break;
    case "books":
      await Book.insertMany(data);
      break;
    case "borrowers":
      await BorrowRecord.insertMany(data);
      break;
    default:
      return res.status(400).json({ error: "Invalid import type" });
  }

  res.json({ message: `${type} imported successfully` });
};
