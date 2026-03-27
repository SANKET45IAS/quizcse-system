import { DIFFICULTY_LEVELS } from "./questionFormUtils";
import { getImageUrl } from "../services/api";

function QuestionCardFields({
  entryIndex,
  formData,
  imageState,
  onFieldChange,
  onTypeChange,
  onOptionTextChange,
  onCorrectAnswerToggle,
  onQuestionImageChange,
  onExplanationImageChange,
  onOptionImageChange,
  onImageRemovalToggle,
  onOptionImageRemovalToggle,
  onClearSelectedOptionImage,
  onAnswerRangeChange,
  onRemove,
  canRemove,
  showBatchHeader = true,
}) {
  return (
    <section className="section-card question-entry-card">
      {(showBatchHeader || canRemove) && (
        <div className="entry-header">
          {showBatchHeader ? (
            <div>
              <p className="eyebrow">Batch Entry</p>
              <h2>{`Question ${entryIndex + 1}`}</h2>
              <p className="entry-meta">{formData.topic}</p>
            </div>
          ) : (
            <div />
          )}

          {canRemove && (
            <button type="button" className="button ghost" onClick={onRemove}>
              Remove
            </button>
          )}
        </div>
      )}

      <div className="form-grid">
        <label className="field">
          <span>Question Type</span>
          <select value={formData.type} onChange={(event) => onTypeChange(event.target.value)}>
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
          onChange={(event) => onFieldChange("question", event.target.value)}
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
                  onImageRemovalToggle("removeQuestionImage", event.target.checked)
                }
              />
              <span>Remove current question image</span>
            </label>
          </div>
        )}

        <label className="field">
          <span>Upload Question Image</span>
          <input type="file" accept="image/*" onChange={onQuestionImageChange} />
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
              <div key={`option-${entryIndex}-${index}`} className="option-card">
                <label className="field">
                  <span>{`Option ${index + 1}`}</span>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(event) => onOptionTextChange(index, event.target.value)}
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
                          onOptionImageRemovalToggle(index, event.target.checked)
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
                    onChange={(event) => onOptionImageChange(index, event)}
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
                      onClick={() => onClearSelectedOptionImage(index)}
                    >
                      Remove selected file
                    </button>
                  </div>
                )}

                <label className="checkbox-row highlight">
                  <input
                    type="checkbox"
                    checked={formData.correctAnswer.includes(index + 1)}
                    onChange={() => onCorrectAnswerToggle(index + 1)}
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
                onChange={(event) => onAnswerRangeChange("min", event.target.value)}
                placeholder="0.49"
              />
            </label>

            <label className="field">
              <span>Maximum Value</span>
              <input
                type="number"
                step="any"
                value={formData.answerRange.max}
                onChange={(event) => onAnswerRangeChange("max", event.target.value)}
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
          onChange={(event) => onFieldChange("explanation", event.target.value)}
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
              <p className="file-note">Current explanation image will be removed when you save.</p>
            )}
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={imageState.removeExplanationImage}
                onChange={(event) =>
                  onImageRemovalToggle("removeExplanationImage", event.target.checked)
                }
              />
              <span>Remove current explanation image</span>
            </label>
          </div>
        )}

        <label className="field">
          <span>Upload Explanation Image</span>
          <input type="file" accept="image/*" onChange={onExplanationImageChange} />
        </label>
        {imageState.newExplanationImage && (
          <p className="file-note">Selected file: {imageState.newExplanationImage.name}</p>
        )}
      </section>

      <label className="field">
        <span>Difficulty Level</span>
        <select
          name="difficultyTag"
          value={formData.difficultyTag}
          onChange={(event) => onFieldChange("difficultyTag", event.target.value)}
        >
          {DIFFICULTY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

export default QuestionCardFields;
