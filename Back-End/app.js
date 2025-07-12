//! Environment variables
require("dotenv").config();

//! Importing
const express = require("express");
const cors = require("cors");
const authMiddleware = require("./middleware/authMiddleware");

const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const dotenv = require("dotenv");

//!  MiddleWare + App + DataBase
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const dbURI = process.env.MONGODB_URI;

//! APIs
//^-----------------------------------------------------------------------------------POST REQUESTS-----------------------------------------------------------------------------------
//&--Register API
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email: email, password: hashedPassword, username: username });
    const savedUser = await newUser.save();
    res.status(201).json({ message: "User registered successfully!", userId: savedUser._id });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" });
  }
});

//&--Login API
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email or password are missing" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const payload = { userId: user._id, email: user.email, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Logged in successfully!", token });
  } catch (err) {
    res.status(500).json({ message: "Server error during login." });
  }
});

//! DataBase
mongoose
  .connect(dbURI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(port, () => {
      console.log(`🚀 Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ DATABASE CONNECTION FAILED:", err);
    process.exit(1);
  });
