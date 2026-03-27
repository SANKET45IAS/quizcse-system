const fs = require("fs/promises");
const mongoose = require("mongoose");
const path = require("path");

const {
  getLegacyQuestionModel,
  getQuestionModel,
  listQuestionModels,
  normalizeTopicKey,
} = require("../models");

const uploadsDirectory = path.join(__dirname, "..", "uploads");
const VALID_TYPES = ["MCQ", "NAT"];

const DEFAULT_FILE_FIELDS = {
  questionImage: "questionImage",
  answerImage: "answerImage",
  explanationImage: "explanationImage",
  optionImage: (index) => `optionImage${index}`,
};

const getBatchFileFields = (questionIndex) => ({
  questionImage: `questionImage-${questionIndex}`,
  answerImage: `answerImage-${questionIndex}`,
  explanationImage: `explanationImage-${questionIndex}`,
  optionImage: (optionIndex) => `optionImage-${questionIndex}-${optionIndex}`,
});

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

  const normalized = storedPath.replace(/^\/+/, "").replace(/^uploads[\\/]/, "");

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

const collectQuestionAssets = (question) =>
  [
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

const buildQuestionData = ({
  payload,
  fileMap,
  existingQuestion,
  fileFields = DEFAULT_FILE_FIELDS,
  overrideTopic = "",
}) => {
  const cleanupPaths = [];

  const topic = safeTrim(overrideTopic || payload.topic);
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
      uploadedFile: fileMap[fileFields.questionImage],
      existingPath: existingQuestion?.questionImage || "",
      removeRequested: Boolean(imageState.questionImage?.remove),
      cleanupPaths,
    }),
    answerImage: resolveImageValue({
      uploadedFile: fileMap[fileFields.answerImage],
      existingPath: existingQuestion?.answerImage || "",
      removeRequested: Boolean(imageState.answerImage?.remove),
      cleanupPaths,
    }),
    explanationImage: resolveImageValue({
      uploadedFile: fileMap[fileFields.explanationImage],
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
          uploadedFile: fileMap[fileFields.optionImage(index)],
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
      ...(existingQuestion?.options || []).map((option) => option.image).filter(Boolean)
    );

    data.options = [];
    data.correctAnswer = [];
    data.answerRange = { min: minimum, max: maximum };
  }

  return { data, cleanupPaths };
};

const getCandidateModels = (requestedTopic) => {
  const models = [];
  const seenCollections = new Set();

  if (requestedTopic) {
    const requestedModel = getQuestionModel(requestedTopic);

    if (requestedModel) {
      models.push(requestedModel);
      seenCollections.add(requestedModel.collection.name);
    }
  }

  const existingModels = listQuestionModels();

  existingModels.forEach((model) => {
    if (!seenCollections.has(model.collection.name)) {
      models.push(model);
      seenCollections.add(model.collection.name);
    }
  });

  const legacyModel = getLegacyQuestionModel();

  if (!seenCollections.has(legacyModel.collection.name)) {
    models.push(legacyModel);
  }

  return models;
};

const getQuestionModelOrThrow = (topic) => {
  const model = getQuestionModel(topic);

  if (!model) {
    throw new Error("Unsupported subject.");
  }

  return model;
};

const findQuestionRecord = async (id, requestedTopic = "") => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid question id.");
  }

  const models = getCandidateModels(requestedTopic);

  for (const Model of models) {
    const question = await Model.findById(id);

    if (question) {
      return { question, model: Model };
    }
  }

  return null;
};

const sortQuestionsByRecentActivity = (questions = []) =>
  [...questions].sort((left, right) => {
    const leftUpdatedAt = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightUpdatedAt = new Date(right.updatedAt || right.createdAt || 0).getTime();

    if (rightUpdatedAt !== leftUpdatedAt) {
      return rightUpdatedAt - leftUpdatedAt;
    }

    return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
  });

const getAllQuestions = async (req, res) => {
  try {
    const requestedTopic = safeTrim(req.query.topic);

    if (requestedTopic) {
      const normalizedRequestedTopic = normalizeTopicKey(requestedTopic);
      const [subjectQuestions, legacyQuestions] = await Promise.all([
        getQuestionModelOrThrow(requestedTopic).find().lean(),
        getLegacyQuestionModel().find().lean(),
      ]);

      const filteredQuestions = [...subjectQuestions, ...legacyQuestions].filter(
        (question) => normalizeTopicKey(question.topic) === normalizedRequestedTopic
      );

      res.status(200).json(sortQuestionsByRecentActivity(filteredQuestions));
      return;
    }

    const models = listQuestionModels();
    const allModels = [...models, getLegacyQuestionModel()];

    if (!allModels.length) {
      res.status(200).json([]);
      return;
    }

    const questionSets = await Promise.all(allModels.map((Model) => Model.find().lean()));
    res.status(200).json(sortQuestionsByRecentActivity(questionSets.flat()));
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch questions." });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const record = await findQuestionRecord(req.params.id, safeTrim(req.query.topic));

    if (!record) {
      res.status(404).json({ message: "Question not found." });
      return;
    }

    res.status(200).json(record.question);
  } catch (error) {
    res.status(400).json({ message: error.message || "Invalid question id." });
  }
};

const createQuestion = async (req, res) => {
  try {
    const payload = parsePayload(req.body.payload);
    const questionPayloads = Array.isArray(payload.questions) ? payload.questions : [payload];

    if (!questionPayloads.length) {
      throw new Error("Add at least one question before saving.");
    }

    const sharedTopic = safeTrim(payload.topic);
    const fileMap = buildFileMap(req.files);

    const preparedQuestions = questionPayloads.map((questionPayload, index) =>
      buildQuestionData({
        payload: questionPayload,
        fileMap,
        existingQuestion: null,
        fileFields: Array.isArray(payload.questions) ? getBatchFileFields(index) : DEFAULT_FILE_FIELDS,
        overrideTopic: sharedTopic,
      })
    );

    const topics = [...new Set(preparedQuestions.map(({ data }) => data.topic))];

    if (topics.length !== 1) {
      throw new Error("All questions in one save must belong to the same subject.");
    }

    const QuestionModel = getQuestionModelOrThrow(topics[0]);
    const createdQuestions = await QuestionModel.insertMany(
      preparedQuestions.map(({ data }) => data)
    );

    res.status(201).json(Array.isArray(payload.questions) ? createdQuestions : createdQuestions[0]);
  } catch (error) {
    await deleteRequestFiles(req.files);
    res.status(400).json({ message: error.message || "Unable to create question." });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const record = await findQuestionRecord(req.params.id, safeTrim(req.query.topic));

    if (!record) {
      await deleteRequestFiles(req.files);
      res.status(404).json({ message: "Question not found." });
      return;
    }

    const payload = parsePayload(req.body.payload);
    const { data, cleanupPaths } = buildQuestionData({
      payload,
      fileMap: buildFileMap(req.files),
      existingQuestion: record.question,
      fileFields: DEFAULT_FILE_FIELDS,
    });

    const targetModel = getQuestionModelOrThrow(data.topic);
    let savedQuestion = null;

    if (targetModel.collection.name === record.model.collection.name) {
      record.question.set(data);
      savedQuestion = await record.question.save();
    } else {
      const replacementDocument = {
        ...record.question.toObject(),
        ...data,
        _id: record.question._id,
        createdAt: record.question.createdAt,
      };

      delete replacementDocument.__v;

      savedQuestion = await targetModel.findOneAndUpdate(
        { _id: record.question._id },
        replacementDocument,
        {
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
          upsert: true,
        }
      );

      await record.question.deleteOne();
    }

    await deleteFiles(cleanupPaths);
    res.status(200).json(savedQuestion);
  } catch (error) {
    await deleteRequestFiles(req.files);
    res.status(400).json({ message: error.message || "Unable to update question." });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const record = await findQuestionRecord(req.params.id, safeTrim(req.query.topic));

    if (!record) {
      res.status(404).json({ message: "Question not found." });
      return;
    }

    const assetPaths = collectQuestionAssets(record.question);
    await record.question.deleteOne();
    await deleteFiles(assetPaths);

    res.status(200).json({ message: "Question deleted successfully." });
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to delete question." });
  }
};

module.exports = {
  createQuestion,
  deleteQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
};
