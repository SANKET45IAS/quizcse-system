import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SUBJECTS } from "../constants/subjects";
import api, { getApiErrorMessage } from "../services/api";
import { getRememberedSubject, rememberSubject } from "../utils/subjectPreference";

const normalizeTopicKey = (topic) =>
  String(topic || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

function ViewQuestions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(getRememberedSubject);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchQuestions = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/questions", {
          params: { topic: selectedTopic },
        });

        if (isCurrentRequest) {
          setQuestions(response.data);
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setQuestions([]);
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (isCurrentRequest) {
          setLoading(false);
        }
      }
    };

    rememberSubject(selectedTopic);
    fetchQuestions();

    return () => {
      isCurrentRequest = false;
    };
  }, [selectedTopic]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this question and its uploaded images?");

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/questions/${id}`, {
        params: { topic: selectedTopic },
      });
      setQuestions((current) => current.filter((question) => question._id !== id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const visibleQuestions = questions.filter(
    (question) => normalizeTopicKey(question.topic) === normalizeTopicKey(selectedTopic)
  );

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
            <p>{`${visibleQuestions.length} question${visibleQuestions.length === 1 ? "" : "s"} in this topic`}</p>
          </div>
        </div>

        {loading ? (
          <p className="message">Loading questions...</p>
        ) : visibleQuestions.length === 0 ? (
          <div className="empty-state">
            <h2>No questions for this topic</h2>
            <p>{`No questions are saved in ${selectedTopic} yet.`}</p>
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
                {visibleQuestions.map((question) => (
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
                      <Link
                        className="table-link"
                        to={`/edit-question/${question._id}?topic=${encodeURIComponent(question.topic)}`}
                      >
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
