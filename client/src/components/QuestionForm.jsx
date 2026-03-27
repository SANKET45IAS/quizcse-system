import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SUBJECTS } from "../constants/subjects";
import api, { getApiErrorMessage } from "../services/api";
import { getRememberedSubject, rememberSubject } from "../utils/subjectPreference";
import QuestionCardFields from "./QuestionCardFields";
import {
  buildQuestionPayload,
  createQuestionEntry,
  validateQuestionForm,
} from "./questionFormUtils";

const DEFAULT_FILE_FIELDS = {
  questionImage: "questionImage",
  explanationImage: "explanationImage",
  optionImage: (index) => `optionImage${index}`,
};

const getBatchFileFields = (entryIndex) => ({
  questionImage: `questionImage-${entryIndex}`,
  explanationImage: `explanationImage-${entryIndex}`,
  optionImage: (optionIndex) => `optionImage-${entryIndex}-${optionIndex}`,
});

const buildInitialEntries = (initialData, defaultTopic) => [
  createQuestionEntry(initialData || {}, defaultTopic),
];

const appendEntryFiles = (requestData, entry, fileFields) => {
  if (entry.imageState.newQuestionImage) {
    requestData.append(fileFields.questionImage, entry.imageState.newQuestionImage);
  }

  if (entry.imageState.newExplanationImage) {
    requestData.append(fileFields.explanationImage, entry.imageState.newExplanationImage);
  }

  entry.imageState.optionImages.forEach((optionImage, index) => {
    if (optionImage.newFile) {
      requestData.append(fileFields.optionImage(index), optionImage.newFile);
    }
  });
};

function QuestionForm({ mode = "create", initialData }) {
  const navigate = useNavigate();
  const isEditMode = mode === "edit";
  const startingTopic = initialData?.topic || getRememberedSubject();
  const [selectedTopic, setSelectedTopic] = useState(startingTopic);
  const [entries, setEntries] = useState(() => buildInitialEntries(initialData, startingTopic));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const nextTopic = initialData?.topic || getRememberedSubject();
    setSelectedTopic(nextTopic);
    setEntries(buildInitialEntries(initialData, nextTopic));
    setError("");
  }, [initialData]);

  useEffect(() => {
    rememberSubject(selectedTopic);

    setEntries((currentEntries) => {
      let hasChanged = false;

      const nextEntries = currentEntries.map((entry) => {
        if (entry.formData.topic === selectedTopic) {
          return entry;
        }

        hasChanged = true;

        return {
          ...entry,
          formData: {
            ...entry.formData,
            topic: selectedTopic,
          },
        };
      });

      return hasChanged ? nextEntries : currentEntries;
    });
  }, [selectedTopic]);

  const updateEntry = (entryId, updater) => {
    setEntries((currentEntries) =>
      currentEntries.map((entry) => (entry.id === entryId ? updater(entry) : entry))
    );
  };

  const updateEntryFormData = (entryId, updater) => {
    updateEntry(entryId, (entry) => ({
      ...entry,
      formData: updater(entry.formData),
    }));
  };

  const updateEntryImageState = (entryId, updater) => {
    updateEntry(entryId, (entry) => ({
      ...entry,
      imageState: updater(entry.imageState),
    }));
  };

  const handleFieldChange = (entryId, name, value) => {
    updateEntryFormData(entryId, (currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleTypeChange = (entryId, value) => {
    updateEntryFormData(entryId, (currentFormData) => ({
      ...currentFormData,
      type: value,
      correctAnswer: value === "MCQ" ? currentFormData.correctAnswer : [],
      answerRange:
        value === "NAT"
          ? currentFormData.answerRange
          : {
              min: "",
              max: "",
            },
    }));
  };

  const handleOptionTextChange = (entryId, index, value) => {
    updateEntryFormData(entryId, (currentFormData) => ({
      ...currentFormData,
      options: currentFormData.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text: value } : option
      ),
    }));
  };

  const handleCorrectAnswerToggle = (entryId, optionNumber) => {
    updateEntryFormData(entryId, (currentFormData) => {
      const alreadySelected = currentFormData.correctAnswer.includes(optionNumber);

      return {
        ...currentFormData,
        correctAnswer: alreadySelected
          ? currentFormData.correctAnswer.filter((value) => value !== optionNumber)
          : [...currentFormData.correctAnswer, optionNumber].sort((left, right) => left - right),
      };
    });
  };

  const handleAnswerRangeChange = (entryId, name, value) => {
    updateEntryFormData(entryId, (currentFormData) => ({
      ...currentFormData,
      answerRange: {
        ...currentFormData.answerRange,
        [name]: value,
      },
    }));
  };

  const handleQuestionImageChange = (entryId, event) => {
    const file = event.target.files?.[0] || null;

    updateEntryImageState(entryId, (currentImageState) => ({
      ...currentImageState,
      newQuestionImage: file,
      removeQuestionImage: false,
    }));
  };

  const handleExplanationImageChange = (entryId, event) => {
    const file = event.target.files?.[0] || null;

    updateEntryImageState(entryId, (currentImageState) => ({
      ...currentImageState,
      newExplanationImage: file,
      removeExplanationImage: false,
    }));
  };

  const handleOptionImageChange = (entryId, index, event) => {
    const file = event.target.files?.[0] || null;

    updateEntryImageState(entryId, (currentImageState) => ({
      ...currentImageState,
      optionImages: currentImageState.optionImages.map((optionImage, optionIndex) =>
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

  const handleImageRemovalToggle = (entryId, field, checked) => {
    updateEntryImageState(entryId, (currentImageState) => ({
      ...currentImageState,
      [field]: checked,
    }));
  };

  const handleOptionImageRemovalToggle = (entryId, index, checked) => {
    updateEntryImageState(entryId, (currentImageState) => ({
      ...currentImageState,
      optionImages: currentImageState.optionImages.map((optionImage, optionIndex) =>
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

  const handleClearSelectedOptionImage = (entryId, index) => {
    updateEntryImageState(entryId, (currentImageState) => ({
      ...currentImageState,
      optionImages: currentImageState.optionImages.map((optionImage, optionIndex) =>
        optionIndex === index
          ? {
              ...optionImage,
              newFile: null,
            }
          : optionImage
      ),
    }));
  };

  const handleAddQuestion = () => {
    setEntries((currentEntries) => [...currentEntries, createQuestionEntry({}, selectedTopic)]);
  };

  const handleRemoveQuestion = (entryId) => {
    setEntries((currentEntries) =>
      currentEntries.length === 1
        ? currentEntries
        : currentEntries.filter((entry) => entry.id !== entryId)
    );
  };

  const validateEntries = () => {
    for (let index = 0; index < entries.length; index += 1) {
      const validationMessage = validateQuestionForm(entries[index].formData);

      if (validationMessage) {
        return `Question ${index + 1}: ${validationMessage}`;
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateEntries();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      if (isEditMode && initialData?._id) {
        const entry = entries[0];
        const requestData = new FormData();
        requestData.append("payload", JSON.stringify(buildQuestionPayload(entry.formData, entry.imageState)));
        appendEntryFiles(requestData, entry, DEFAULT_FILE_FIELDS);

        await api.put(`/questions/${initialData._id}`, requestData, {
          params: initialData?.topic ? { topic: initialData.topic } : undefined,
        });

        rememberSubject(entry.formData.topic);
      } else {
        const requestData = new FormData();
        const payload = {
          topic: selectedTopic,
          questions: entries.map((entry) => buildQuestionPayload(entry.formData, entry.imageState)),
        };

        requestData.append("payload", JSON.stringify(payload));
        entries.forEach((entry, index) => appendEntryFiles(requestData, entry, getBatchFileFields(index)));

        await api.post("/questions", requestData);
        rememberSubject(selectedTopic);
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
          <h1>{isEditMode ? "Edit Question" : "Add Questions"}</h1>
        </div>
        <button type="button" className="button secondary" onClick={() => navigate("/questions")}>
          Back to Questions
        </button>
      </div>

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <section className="subject-panel">
          <div className="form-grid">
            <label className="field">
              <span>Subject</span>
              <select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="subject-panel-copy">
            <h2>{selectedTopic}</h2>
            <p>
              {isEditMode
                ? "This question will stay linked to the selected subject table when you save."
                : "This subject is shared across every question card below, so you can add multiple questions in one save."}
            </p>
          </div>

          {!isEditMode && (
            <div className="button-row">
              <button type="button" className="button secondary" onClick={handleAddQuestion}>
                + Add Another Question
              </button>
            </div>
          )}
        </section>

        <div className="question-stack">
          {entries.map((entry, index) => (
            <QuestionCardFields
              key={entry.id}
              entryIndex={index}
              formData={entry.formData}
              imageState={entry.imageState}
              onFieldChange={(name, value) => handleFieldChange(entry.id, name, value)}
              onTypeChange={(value) => handleTypeChange(entry.id, value)}
              onOptionTextChange={(optionIndex, value) =>
                handleOptionTextChange(entry.id, optionIndex, value)
              }
              onCorrectAnswerToggle={(optionNumber) =>
                handleCorrectAnswerToggle(entry.id, optionNumber)
              }
              onQuestionImageChange={(event) => handleQuestionImageChange(entry.id, event)}
              onExplanationImageChange={(event) =>
                handleExplanationImageChange(entry.id, event)
              }
              onOptionImageChange={(optionIndex, event) =>
                handleOptionImageChange(entry.id, optionIndex, event)
              }
              onImageRemovalToggle={(field, checked) =>
                handleImageRemovalToggle(entry.id, field, checked)
              }
              onOptionImageRemovalToggle={(optionIndex, checked) =>
                handleOptionImageRemovalToggle(entry.id, optionIndex, checked)
              }
              onClearSelectedOptionImage={(optionIndex) =>
                handleClearSelectedOptionImage(entry.id, optionIndex)
              }
              onAnswerRangeChange={(name, value) => handleAnswerRangeChange(entry.id, name, value)}
              onRemove={() => handleRemoveQuestion(entry.id)}
              canRemove={!isEditMode && entries.length > 1}
              showBatchHeader={!isEditMode}
            />
          ))}
        </div>

        {error && <p className="message error">{error}</p>}

        <div className="button-row">
          <button type="submit" className="button" disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : isEditMode
                ? "Update Question"
                : `Save ${entries.length} Question${entries.length === 1 ? "" : "s"}`}
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
