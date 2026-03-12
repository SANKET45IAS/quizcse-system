import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api, { getApiErrorMessage } from "../services/api";

function ViewQuestions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        {loading ? (
          <p className="message">Loading questions...</p>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <h2>No questions available</h2>
            <p>Start by adding your first question to the quiz bank.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Edit</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question._id}>
                    <td>
                      {question.question.length > 90
                        ? `${question.question.slice(0, 90)}...`
                        : question.question}
                    </td>
                    <td>{question.topic}</td>
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

