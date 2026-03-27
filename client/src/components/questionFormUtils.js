import { SUBJECTS } from "../constants/subjects";

export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

export const createDefaultOptions = (incomingOptions = []) =>
  Array.from({ length: 4 }, (_item, index) => ({
    text: incomingOptions[index]?.text || "",
    image: incomingOptions[index]?.image || "",
  }));

export const buildInitialFormState = (initialData = {}, defaultTopic = SUBJECTS[0]) => ({
  topic: initialData?.topic || defaultTopic,
  type: initialData?.type || "MCQ",
  question: initialData?.question || "",
  options: createDefaultOptions(initialData?.options || []),
  correctAnswer: Array.isArray(initialData?.correctAnswer)
    ? initialData.correctAnswer.map((value) => Number(value))
    : [],
  answerRange: {
    min:
      initialData?.answerRange?.min === null || initialData?.answerRange?.min === undefined
        ? ""
        : String(initialData.answerRange.min),
    max:
      initialData?.answerRange?.max === null || initialData?.answerRange?.max === undefined
        ? ""
        : String(initialData.answerRange.max),
  },
  explanation: initialData?.explanation || "",
  difficultyTag: initialData?.difficultyTag || "Medium",
});

export const buildInitialImageState = (initialData = {}) => ({
  existingQuestionImage: initialData?.questionImage || "",
  newQuestionImage: null,
  removeQuestionImage: false,
  existingExplanationImage: initialData?.explanationImage || "",
  newExplanationImage: null,
  removeExplanationImage: false,
  optionImages: createDefaultOptions(initialData?.options || []).map((option) => ({
    existing: option.image || "",
    newFile: null,
    removeExisting: false,
  })),
});

const createEntryId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createQuestionEntry = (initialData = {}, defaultTopic = SUBJECTS[0]) => ({
  id: createEntryId(),
  formData: buildInitialFormState(initialData, defaultTopic),
  imageState: buildInitialImageState(initialData),
});

export const validateQuestionForm = (formData) => {
  if (!formData.question.trim()) {
    return "Question text is required.";
  }

  if (formData.type === "MCQ") {
    const hasEmptyOption = formData.options.some((option) => !option.text.trim());

    if (hasEmptyOption) {
      return "All four MCQ options must include text.";
    }

    if (!formData.correctAnswer.length) {
      return "Select at least one correct answer.";
    }
  }

  if (formData.type === "NAT") {
    const minimum = Number(formData.answerRange.min);
    const maximum = Number(formData.answerRange.max);

    if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
      return "Enter a valid numeric range for NAT questions.";
    }

    if (minimum > maximum) {
      return "Minimum answer range cannot be greater than maximum.";
    }
  }

  return "";
};

export const buildQuestionPayload = (formData, imageState) => ({
  topic: formData.topic,
  type: formData.type,
  question: formData.question.trim(),
  options:
    formData.type === "MCQ"
      ? formData.options.map((option) => ({ text: option.text.trim() }))
      : [],
  correctAnswer: formData.type === "MCQ" ? formData.correctAnswer : [],
  answerRange:
    formData.type === "NAT"
      ? {
          min: formData.answerRange.min,
          max: formData.answerRange.max,
        }
      : null,
  explanation: formData.explanation.trim(),
  difficultyTag: formData.difficultyTag,
  imageState: {
    questionImage: { remove: imageState.removeQuestionImage },
    explanationImage: { remove: imageState.removeExplanationImage },
    options: imageState.optionImages.map((optionImage) => ({
      remove: optionImage.removeExisting,
    })),
  },
});
