const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const answerRangeSchema = new mongoose.Schema(
  {
    min: {
      type: Number,
      default: null,
    },
    max: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["MCQ", "NAT"],
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    questionImage: {
      type: String,
      default: "",
    },
    options: {
      type: [optionSchema],
      default: [],
    },
    correctAnswer: {
      type: [Number],
      default: [],
    },
    answerRange: {
      type: answerRangeSchema,
      default: () => ({ min: null, max: null }),
    },
    answerImage: {
      type: String,
      default: "",
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
    },
    explanationImage: {
      type: String,
      default: "",
    },
    difficultyTag: {
      type: String,
      default: "Medium",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Question", questionSchema);

