const Book = require("../models/Book");
const BorrowRecord = require("../models/BorrowRecord");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const XLSX = require("xlsx");

// ---------------- Export Books as Excel ---------------- //
const exportBooks = async (req, res) => {
  try {
    const books = await Book.find().lean();

    if (!books || books.length === 0) {
      return res.status(404).json({ error: "No books found" });
    }

    // Map books to a simple object format for Excel
    const data = books.map((b) => ({
      Name: b.name,
      Author: b.author,
      Category: b.category,
      "Available Copies": b.availableCopies,
      "Total Copies": b.totalCopies,
      "Publisher Year": b.publisherYear,
      "Borrow Price": b.borrowPrice,
      Description: b.description,
      Image: b.image || "",
      CreatedAt: b.createdAt.toISOString(),
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Books");

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set headers and send file
    res.setHeader("Content-Disposition", 'attachment; filename="books.xlsx"');
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export books" });
  }
};

/* ---------------- BOOK CRUD ---------------- */

/* ---------------- CREATE BOOK ---------------- */

exports.createBook = async (req, res) => {
  try {
    // 1️⃣ Extract fields from req.body
    const {
      name,
      author,
      availableCopies,
      totalCopies,
      category,
      publisherYear,
      borrowPrice,
      description,
    } = req.body;

    // 2️⃣ Validate required fields
    if (
      !name ||
      !author ||
      !availableCopies ||
      !totalCopies ||
      !category ||
      !publisherYear ||
      !borrowPrice ||
      !description
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 3️⃣ Build bookData object and convert numeric fields
    const bookData = {
      name,
      author,
      availableCopies: Number(availableCopies),
      totalCopies: Number(totalCopies),
      category,
      publisherYear: Number(publisherYear),
      borrowPrice: Number(borrowPrice),
      description,
    };

    // 4️⃣ Add image path if file uploaded via multer
    if (req.file) {
      bookData.image = req.file.path;
    }

    // 5️⃣ Save the book to the database
    const book = new Book(bookData);
    await book.save();

    // 6️⃣ Send success response
    res.status(201).json(book);
  } catch (err) {
    console.error(err);
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

module.exports = {
  createBook: exports.createBook,
  updateBook: exports.updateBook,
  deleteBook: exports.deleteBook,
  getBookDetail: exports.getBookDetail,
  listBooks: exports.listBooks,
  borrowBook: exports.borrowBook,
  returnBook: exports.returnBook,
  orderBook: exports.orderBook,
  exportBooks,
};

// module.exports = { uploadBookImage };
