const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Allow requests from your frontend
app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000"], // add all frontend origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // if using cookies or authorization headers
  })
);
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const bookRoutes = require("./routes/bookRoutes");
const exportImportRoutes = require("./routes/exportImportRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/data", exportImportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
