import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SUBJECTS } from "../constants/subjects";
import api, { getApiErrorMessage } from "../services/api";

function ViewQuestions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(SUBJECTS[0]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get("/questions");
        setQuestions(response.data);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    if (!questions.length) {
      setSelectedTopic(SUBJECTS[0]);
      return;
    }

    const availableTopics = new Set(questions.map((question) => question.topic));

    setSelectedTopic((currentTopic) => {
      if (currentTopic && availableTopics.has(currentTopic)) {
        return currentTopic;
      }

      return SUBJECTS.find((topic) => availableTopics.has(topic)) || SUBJECTS[0];
    });
  }, [questions]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this question and its uploaded images?");

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/questions/${id}`);
      setQuestions((current) => current.filter((question) => question._id !== id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const filteredQuestions = questions.filter((question) => question.topic === selectedTopic);

  return (
    <div className="page-shell">
      <section className="panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">Question Bank</p>
            <h1>View Questions</h1>
          </div>

          <div className="button-row">
            <button
              type="button"
              className="button secondary"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>
            <button type="button" className="button" onClick={() => navigate("/add-question")}>
              Add Question
            </button>
          </div>
        </div>

        {error && <p className="message error">{error}</p>}

        <div className="filter-bar">
          <label className="field topic-filter">
            <span>Select Topic</span>
            <select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
              {SUBJECTS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </label>

          <div className="topic-summary">
            <h2>{selectedTopic}</h2>
            <p>{`${filteredQuestions.length} question${filteredQuestions.length === 1 ? "" : "s"} in this topic`}</p>
          </div>
        </div>

        {loading ? (
          <p className="message">Loading questions...</p>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <h2>No questions available</h2>
            <p>Start by adding your first question to the quiz bank.</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="empty-state">
            <h2>No questions for this topic</h2>
            <p>Select another topic or add a new question in {selectedTopic}.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Type</th>
                  <th>Edit</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((question) => (
                  <tr key={question._id}>
                    <td>
                      {question.question.length > 90
                        ? `${question.question.slice(0, 90)}...`
                        : question.question}
                    </td>
                    <td>
                      <span className="tag">{question.type}</span>
                    </td>
                    <td>
                      <Link className="table-link" to={`/edit-question/${question._id}`}>
                        Edit
                      </Link>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="table-button danger"
                        onClick={() => handleDelete(question._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default ViewQuestions;
