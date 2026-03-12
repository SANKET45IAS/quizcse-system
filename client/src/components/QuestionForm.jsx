import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SUBJECTS } from "../constants/subjects";
import api, { getApiErrorMessage, getImageUrl } from "../services/api";

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

const createDefaultOptions = (incomingOptions = []) =>
  Array.from({ length: 4 }, (_item, index) => ({
    text: incomingOptions[index]?.text || "",
    image: incomingOptions[index]?.image || "",
  }));

const buildInitialFormState = (initialData) => ({
  topic: initialData?.topic || SUBJECTS[0],
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

const buildInitialImageState = (initialData) => ({
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

function QuestionForm({ mode = "create", initialData }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(buildInitialFormState(initialData));
  const [imageState, setImageState] = useState(buildInitialImageState(initialData));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = mode === "edit";

  useEffect(() => {
    setFormData(buildInitialFormState(initialData));
    setImageState(buildInitialImageState(initialData));
    setError("");
  }, [initialData]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleTypeChange = (event) => {
    const { value } = event.target;

    setFormData((current) => ({
      ...current,
      type: value,
      correctAnswer: value === "MCQ" ? current.correctAnswer : [],
      answerRange:
        value === "NAT"
          ? current.answerRange
          : {
              min: "",
              max: "",
            },
    }));
  };

  const handleOptionTextChange = (index, value) => {
    setFormData((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text: value } : option
      ),
    }));
  };

  const handleCorrectAnswerToggle = (optionNumber) => {
    setFormData((current) => {
      const alreadySelected = current.correctAnswer.includes(optionNumber);

      return {
        ...current,
        correctAnswer: alreadySelected
          ? current.correctAnswer.filter((value) => value !== optionNumber)
          : [...current.correctAnswer, optionNumber].sort((left, right) => left - right),
      };
    });
  };

  const handleQuestionImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    setImageState((current) => ({
      ...current,
      newQuestionImage: file,
      removeQuestionImage: false,
    }));
  };

  const handleExplanationImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    setImageState((current) => ({
      ...current,
      newExplanationImage: file,
      removeExplanationImage: false,
    }));
  };

  const handleOptionImageChange = (index, event) => {
    const file = event.target.files?.[0] || null;

    setImageState((current) => ({
      ...current,
      optionImages: current.optionImages.map((optionImage, optionIndex) =>
        optionIndex === index
          ? {
              ...optionImage,
              newFile: file,
              removeExisting: false,
            }
          : optionImage
      ),
    }));
  };

  const handleImageRemovalToggle = (field, checked) => {
    setImageState((current) => ({
      ...current,
      [field]: checked,
    }));
  };

  const handleOptionImageRemovalToggle = (index, checked) => {
    setImageState((current) => ({
      ...current,
      optionImages: current.optionImages.map((optionImage, optionIndex) =>
        optionIndex === index
          ? {
              ...optionImage,
              removeExisting: checked,
              newFile: checked ? null : optionImage.newFile,
            }
          : optionImage
      ),
    }));
  };

  const clearSelectedOptionImage = (index) => {
    setImageState((current) => ({
      ...current,
      optionImages: current.optionImages.map((optionImage, optionIndex) =>
        optionIndex === index
          ? {
              ...optionImage,
              newFile: null,
            }
          : optionImage
      ),
    }));
  };

  const validateForm = () => {
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError("");
    setIsSaving(true);

    const payload = {
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
    };

    const requestData = new FormData();
    requestData.append("payload", JSON.stringify(payload));

    if (imageState.newQuestionImage) {
      requestData.append("questionImage", imageState.newQuestionImage);
    }

    if (imageState.newExplanationImage) {
      requestData.append("explanationImage", imageState.newExplanationImage);
    }

    if (formData.type === "MCQ") {
      imageState.optionImages.forEach((optionImage, index) => {
        if (optionImage.newFile) {
          requestData.append(`optionImage${index}`, optionImage.newFile);
        }
      });
    }

    try {
      if (isEditMode && initialData?._id) {
        await api.put(`/questions/${initialData._id}`, requestData);
      } else {
        await api.post("/questions", requestData);
      }

      navigate("/questions");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Question Management</p>
          <h1>{isEditMode ? "Edit Question" : "Add Question"}</h1>
        </div>
        <button type="button" className="button secondary" onClick={() => navigate("/questions")}>
          Back to Questions
        </button>
      </div>

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Subject</span>
            <select name="topic" value={formData.topic} onChange={handleFieldChange}>
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Question Type</span>
            <select name="type" value={formData.type} onChange={handleTypeChange}>
              <option value="MCQ">MCQ</option>
              <option value="NAT">NAT</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Question Text</span>
          <textarea
            name="question"
            rows="4"
            value={formData.question}
            onChange={handleFieldChange}
            placeholder="Enter the full question statement"
          />
        </label>

        <section className="section-card">
          <div className="section-head">
            <h2>Question Diagram</h2>
          </div>

          {imageState.existingQuestionImage && (
            <div className="existing-image">
              {!imageState.removeQuestionImage ? (
                <img src={getImageUrl(imageState.existingQuestionImage)} alt="Question diagram" />
              ) : (
                <p className="file-note">Current question image will be removed when you save.</p>
              )}
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={imageState.removeQuestionImage}
                  onChange={(event) =>
                    handleImageRemovalToggle("removeQuestionImage", event.target.checked)
                  }
                />
                <span>Remove current question image</span>
              </label>
            </div>
          )}

          <label className="field">
            <span>Upload Question Image</span>
            <input type="file" accept="image/*" onChange={handleQuestionImageChange} />
          </label>
          {imageState.newQuestionImage && (
            <p className="file-note">Selected file: {imageState.newQuestionImage.name}</p>
          )}
        </section>

        {formData.type === "MCQ" ? (
          <section className="section-card">
            <div className="section-head">
              <h2>Options and Answers</h2>
              <p>Select one or more correct answers.</p>
            </div>

            <div className="options-grid">
              {formData.options.map((option, index) => (
                <div key={`option-${index}`} className="option-card">
                  <label className="field">
                    <span>{`Option ${index + 1}`}</span>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(event) => handleOptionTextChange(index, event.target.value)}
                      placeholder={`Enter option ${index + 1}`}
                    />
                  </label>

                  {imageState.optionImages[index].existing && (
                      <div className="existing-image compact">
                        {!imageState.optionImages[index].removeExisting ? (
                          <img
                            src={getImageUrl(imageState.optionImages[index].existing)}
                            alt={`Option ${index + 1}`}
                          />
                        ) : (
                          <p className="file-note">Current option image will be removed on save.</p>
                        )}
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={imageState.optionImages[index].removeExisting}
                            onChange={(event) =>
                              handleOptionImageRemovalToggle(index, event.target.checked)
                            }
                          />
                          <span>Remove current option image</span>
                        </label>
                      </div>
                    )}

                  <label className="field">
                    <span>Option Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleOptionImageChange(index, event)}
                    />
                  </label>
                  {imageState.optionImages[index].newFile && (
                    <div className="inline-image-action">
                      <p className="file-note">
                        Selected file: {imageState.optionImages[index].newFile.name}
                      </p>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => clearSelectedOptionImage(index)}
                      >
                        Remove current option image
                      </button>
                    </div>
                  )}

                  <label className="checkbox-row highlight">
                    <input
                      type="checkbox"
                      checked={formData.correctAnswer.includes(index + 1)}
                      onChange={() => handleCorrectAnswerToggle(index + 1)}
                    />
                    <span>{`Mark option ${index + 1} as correct`}</span>
                  </label>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="section-card">
            <div className="section-head">
              <h2>Answer Range</h2>
              <p>NAT questions accept numeric answers within a range.</p>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Minimum Value</span>
                <input
                  type="number"
                  step="any"
                  value={formData.answerRange.min}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      answerRange: {
                        ...current.answerRange,
                        min: event.target.value,
                      },
                    }))
                  }
                  placeholder="0.49"
                />
              </label>

              <label className="field">
                <span>Maximum Value</span>
                <input
                  type="number"
                  step="any"
                  value={formData.answerRange.max}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      answerRange: {
                        ...current.answerRange,
                        max: event.target.value,
                      },
                    }))
                  }
                  placeholder="0.51"
                />
              </label>
            </div>
          </section>
        )}

        <label className="field">
          <span>Explanation</span>
          <textarea
            name="explanation"
            rows="4"
            value={formData.explanation}
            onChange={handleFieldChange}
            placeholder="Explain the logic or solution"
          />
        </label>

        <section className="section-card">
          <div className="section-head">
            <h2>Explanation Diagram</h2>
          </div>

          {imageState.existingExplanationImage && (
            <div className="existing-image">
              {!imageState.removeExplanationImage ? (
                <img
                  src={getImageUrl(imageState.existingExplanationImage)}
                  alt="Explanation diagram"
                />
              ) : (
                <p className="file-note">
                  Current explanation image will be removed when you save.
                </p>
              )}
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={imageState.removeExplanationImage}
                  onChange={(event) =>
                    handleImageRemovalToggle("removeExplanationImage", event.target.checked)
                  }
                />
                <span>Remove current explanation image</span>
              </label>
            </div>
          )}

          <label className="field">
            <span>Upload Explanation Image</span>
            <input type="file" accept="image/*" onChange={handleExplanationImageChange} />
          </label>
          {imageState.newExplanationImage && (
            <p className="file-note">Selected file: {imageState.newExplanationImage.name}</p>
          )}
        </section>

        <label className="field">
          <span>Difficulty Level</span>
          <select name="difficultyTag" value={formData.difficultyTag} onChange={handleFieldChange}>
            {DIFFICULTY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="message error">{error}</p>}

        <div className="button-row">
          <button type="submit" className="button" disabled={isSaving}>
            {isSaving ? "Saving..." : isEditMode ? "Update Question" : "Save Question"}
          </button>
          <button
            type="button"
            className="button ghost"
            onClick={() => navigate("/dashboard")}
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuestionForm;
