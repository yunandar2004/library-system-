const BorrowRecord = require("../models/BorrowRecord");

exports.borrowerReport = async (req, res) => {
  const { page = 1, limit = 10, type } = req.query;
  let filter = {};
  if (type) filter.type = type;

  const records = await BorrowRecord.find(filter)
    .populate("userId", "name email")
    .populate("bookId", "name author")
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json(records);
};
