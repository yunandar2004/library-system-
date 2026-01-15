const Book = require("../models/Book");
const BorrowRecord = require("../models/BorrowRecord");

/* ---------------- BOOK CRUD ---------------- */
exports.createBook = async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateBook = async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(book);
};

exports.deleteBook = async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.json({ message: "Book deleted" });
};

exports.getBookDetail = async (req, res) => {
  const book = await Book.findById(req.params.id);
  res.json(book);
};

exports.listBooks = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    author,
    category,
    minPrice,
    maxPrice,
  } = req.query;
  let filter = {};
  if (author) filter.author = new RegExp(author, "i");
  if (category) filter.category = new RegExp(category, "i");
  if (minPrice || maxPrice) filter.borrowPrice = {};
  if (minPrice) filter.borrowPrice.$gte = parseFloat(minPrice);
  if (maxPrice) filter.borrowPrice.$lte = parseFloat(maxPrice);
  const total = await Book.countDocuments(filter);
  const books = await Book.find(filter)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    data: books,
  });
};

/* ---------------- BORROWING ---------------- */
exports.borrowBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book || book.availableCopies <= 0) {
    book.status = "out of stock";
    await book.save();
    return res.status(400).json({ error: "Book out of stock" });
  }

  book.availableCopies -= 1;
  if (book.availableCopies === 0) book.status = "out of stock";
  await book.save();

  const borrowedDate = new Date();
  const dueDate = new Date(borrowedDate);
  dueDate.setDate(dueDate.getDate() + 14); // 2 weeks due

  const record = new BorrowRecord({
    userId: req.user.id,
    bookId: book._id,
    type: "borrowed",
    borrowedDate,
    dueDate,
  });
  await record.save();

  res.json({ message: "Book borrowed successfully", record });
};

exports.returnBook = async (req, res) => {
  const record = await BorrowRecord.findById(req.params.recordId).populate(
    "bookId"
  );
  if (!record) return res.status(404).json({ error: "Record not found" });

  record.type = "returned";
  record.returnedDate = new Date();

  // Fine if overdue
  if (record.returnedDate > record.dueDate) {
    const daysLate = Math.ceil(
      (record.returnedDate - record.dueDate) / (1000 * 60 * 60 * 24)
    );
    record.fine = daysLate * 1000; // example fine per day
    record.type = "overdue";
  }

  await record.save();

  // Increase available copies
  const book = record.bookId;
  book.availableCopies += 1;
  book.status = "available";
  await book.save();

  res.json(record);
};

exports.orderBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });

  const borrowedDate = new Date();
  const dueDate = new Date(borrowedDate);
  dueDate.setDate(dueDate.getDate() + 3); // order arrives in 3 days

  const record = new BorrowRecord({
    userId: req.user.id,
    bookId: book._id,
    type: "ordering",
    borrowedDate,
    dueDate,
  });
  await record.save();

  res.json({ message: "Book ordered successfully", record });
};
