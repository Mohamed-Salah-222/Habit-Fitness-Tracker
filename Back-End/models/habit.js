const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const habitSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completions: {
      type: [Date],
    },
  },
  { timestamps: true }
);

const Habit = mongoose.model("Habit", habitSchema);

module.exports = Habit;
