const fs = require("fs/promises");
const path = require("path");

const Question = require("../models/Question");

const uploadsDirectory = path.join(__dirname, "..", "uploads");
const VALID_TYPES = ["MCQ", "NAT"];

const parsePayload = (payload) => {
  if (!payload) {
    return {};
  }

  if (typeof payload === "object") {
    return payload;
  }

  try {
    return JSON.parse(payload);
  } catch (error) {
    throw new Error("Invalid form payload.");
  }
};

const safeTrim = (value) => (typeof value === "string" ? value.trim() : "");

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

const toStoredPath = (file) => (file ? `/uploads/${file.filename}` : "");

const buildFileMap = (files = []) =>
  files.reduce((accumulator, file) => {
    accumulator[file.fieldname] = file;
    return accumulator;
  }, {});

const resolveStoredPath = (storedPath) => {
  if (!storedPath) {
    return null;
  }

  const normalized = storedPath
    .replace(/^\/+/, "")
    .replace(/^uploads[\\/]/, "");

  return path.join(uploadsDirectory, normalized);
};

const deleteFiles = async (paths = []) => {
  await Promise.allSettled(
    paths.filter(Boolean).map(async (storedPath) => {
      const absolutePath = resolveStoredPath(storedPath);

      if (!absolutePath) {
        return;
      }

      try {
        await fs.unlink(absolutePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error(`Failed to delete file: ${absolutePath}`, error.message);
        }
      }
    })
  );
};

const deleteRequestFiles = async (files = []) => {
  await Promise.allSettled(
    files.map(async (file) => {
      try {
        await fs.unlink(path.resolve(file.path));
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error(`Failed to clean uploaded file: ${file.path}`, error.message);
        }
      }
    })
  );
};

const collectQuestionAssets = (question) => [
  question?.questionImage,
  question?.answerImage,
  question?.explanationImage,
  ...(question?.options || []).map((option) => option.image),
].filter(Boolean);

const normalizeCorrectAnswers = (correctAnswer) => {
  const answers = Array.isArray(correctAnswer) ? correctAnswer : [];

  return [...new Set(answers.map((value) => Number(value)))]
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 4)
    .sort((left, right) => left - right);
};

const resolveImageValue = ({ uploadedFile, existingPath, removeRequested, cleanupPaths }) => {
  if (uploadedFile) {
    if (existingPath) {
      cleanupPaths.push(existingPath);
    }

    return toStoredPath(uploadedFile);
  }

  if (removeRequested && existingPath) {
    cleanupPaths.push(existingPath);
    return "";
  }

  return existingPath || "";
};

const buildQuestionData = ({ payload, files, existingQuestion }) => {
  const fileMap = buildFileMap(files);
  const cleanupPaths = [];

  const topic = safeTrim(payload.topic);
  const type = safeTrim(payload.type);
  const question = safeTrim(payload.question);
  const explanation = safeTrim(payload.explanation);
  const difficultyTag = safeTrim(payload.difficultyTag) || "Medium";

  if (!topic) {
    throw new Error("Subject is required.");
  }

  if (!VALID_TYPES.includes(type)) {
    throw new Error("Question type must be MCQ or NAT.");
  }

  if (!question) {
    throw new Error("Question text is required.");
  }

  const imageState = payload.imageState || {};

  const data = {
    topic,
    type,
    question,
    explanation,
    difficultyTag,
    questionImage: resolveImageValue({
      uploadedFile: fileMap.questionImage,
      existingPath: existingQuestion?.questionImage || "",
      removeRequested: Boolean(imageState.questionImage?.remove),
      cleanupPaths,
    }),
    answerImage: resolveImageValue({
      uploadedFile: fileMap.answerImage,
      existingPath: existingQuestion?.answerImage || "",
      removeRequested: Boolean(imageState.answerImage?.remove),
      cleanupPaths,
    }),
    explanationImage: resolveImageValue({
      uploadedFile: fileMap.explanationImage,
      existingPath: existingQuestion?.explanationImage || "",
      removeRequested: Boolean(imageState.explanationImage?.remove),
      cleanupPaths,
    }),
  };

  if (type === "MCQ") {
    const incomingOptions = Array.isArray(payload.options) ? payload.options : [];
    const optionRemovals = Array.isArray(imageState.options) ? imageState.options : [];

    const options = Array.from({ length: 4 }, (_item, index) => {
      const incomingOption = incomingOptions[index] || {};
      const existingOption = existingQuestion?.options?.[index] || {};

      return {
        text: safeTrim(incomingOption.text),
        image: resolveImageValue({
          uploadedFile: fileMap[`optionImage${index}`],
          existingPath: existingOption.image || "",
          removeRequested: Boolean(optionRemovals[index]?.remove),
          cleanupPaths,
        }),
      };
    });

    if (options.some((option) => !option.text)) {
      throw new Error("All four MCQ options must include text.");
    }

    const correctAnswer = normalizeCorrectAnswers(payload.correctAnswer);

    if (!correctAnswer.length) {
      throw new Error("Select at least one correct answer for an MCQ.");
    }

    data.options = options;
    data.correctAnswer = correctAnswer;
    data.answerRange = { min: null, max: null };
  } else {
    const minimum = toNumber(payload.answerRange?.min);
    const maximum = toNumber(payload.answerRange?.max);

    if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
      throw new Error("NAT questions require a valid numeric answer range.");
    }

    if (minimum > maximum) {
      throw new Error("Answer range minimum cannot be greater than maximum.");
    }

    cleanupPaths.push(
      ...(existingQuestion?.options || [])
        .map((option) => option.image)
        .filter(Boolean)
    );

    data.options = [];
    data.correctAnswer = [];
    data.answerRange = { min: minimum, max: maximum };
  }

  return { data, cleanupPaths };
};

const getAllQuestions = async (_req, res) => {
  try {
    const questions = await Question.find().sort({ updatedAt: -1, createdAt: -1 });
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch questions." });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      res.status(404).json({ message: "Question not found." });
      return;
    }

    res.status(200).json(question);
  } catch (error) {
    res.status(400).json({ message: "Invalid question id." });
  }
};

const createQuestion = async (req, res) => {
  try {
    const payload = parsePayload(req.body.payload);
    const { data } = buildQuestionData({
      payload,
      files: req.files,
      existingQuestion: null,
    });

    const question = await Question.create(data);
    res.status(201).json(question);
  } catch (error) {
    await deleteRequestFiles(req.files);
    res.status(400).json({ message: error.message || "Unable to create question." });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const existingQuestion = await Question.findById(req.params.id);

    if (!existingQuestion) {
      await deleteRequestFiles(req.files);
      res.status(404).json({ message: "Question not found." });
      return;
    }

    const payload = parsePayload(req.body.payload);
    const { data, cleanupPaths } = buildQuestionData({
      payload,
      files: req.files,
      existingQuestion,
    });

    existingQuestion.set(data);
    await existingQuestion.save();
    await deleteFiles(cleanupPaths);

    res.status(200).json(existingQuestion);
  } catch (error) {
    await deleteRequestFiles(req.files);

    const statusCode = error.name === "CastError" ? 400 : 400;
    res.status(statusCode).json({ message: error.message || "Unable to update question." });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      res.status(404).json({ message: "Question not found." });
      return;
    }

    const assetPaths = collectQuestionAssets(question);
    await question.deleteOne();
    await deleteFiles(assetPaths);

    res.status(200).json({ message: "Question deleted successfully." });
  } catch (error) {
    res.status(400).json({ message: "Unable to delete question." });
  }
};

module.exports = {
  createQuestion,
  deleteQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
};
