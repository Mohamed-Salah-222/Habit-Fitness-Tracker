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
const { sendVerificationEmail } = require("./services/emailServices");
const Habit = require("./models/habit");

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

    let user = await User.findOne({ email: email });

    if (user && user.isVerified) {
      return res.status(409).json({ message: "This email is already registered and verified." });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (user && !user.isVerified) {
      user.password = await bcrypt.hash(password, 10);
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = verificationCodeExpires;
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      user = new User({
        email,
        username,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpires,
      });
    }

    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationCode);
    } catch (emailError) {
      console.error(emailError);
      return res.status(500).json({ message: "User registered, but failed to send verification email. Please try verifying later." });
    }

    res.status(201).json({ message: "Registration successful! Please check your email for a verification code." });
  } catch (error) {
    console.error("Error during registration process:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});
//&--Verify API

app.post("/api/auth/verify", async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ message: "Email and verification code are required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: "Verification code has expired. Please register again to get a new code." });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Account verified successfully! You can now log in." });
  } catch (error) {
    console.error("Error during account verification:", error);
    res.status(500).json({ message: "Server error during verification." });
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
//&--Habit API
app.post("/api/habits", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({ message: "Habit name is required." });
    }

    const newHabit = new Habit({
      name: name,
      user: userId,
      completions: [],
    });

    const savedHabit = await newHabit.save();

    res.status(201).json(savedHabit);
  } catch (error) {
    console.error("Error creating habit:", error);
    res.status(500).json({ message: "Server error while creating habit." });
  }
});
//&--Mark the habit as complete
app.post("/api/habits/:id/complete", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const habitId = req.params.id;

    const habit = await Habit.findById(habitId);
    if (!habit) {
      return res.status(404).json({ message: "Habit not found." });
    }

    if (habit.user.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: You are not authorized to modify this habit." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyCompletedToday = habit.completions.some((completionDate) => {
      const d = new Date(completionDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (alreadyCompletedToday) {
      return res.status(409).json({ message: "Habit already completed today." });
    }

    habit.completions.push(new Date());
    const updatedHabit = await habit.save();

    res.status(200).json(updatedHabit);
  } catch (error) {
    console.error("Error completing habit:", error);
    res.status(500).json({ message: "Server error while completing habit." });
  }
});
//^-----------------------------------------------------------------------------------GET REQUESTS-----------------------------------------------------------------------------------
//&--Get all habits of a user
app.get("/api/habits", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const habits = await Habit.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json(habits);
  } catch (error) {
    console.error("Error fetching habits:", error);
    res.status(500).json({ message: "Server error while fetching habits." });
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
