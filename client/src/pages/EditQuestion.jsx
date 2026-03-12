import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import QuestionForm from "../components/QuestionForm";
import api, { getApiErrorMessage } from "../services/api";

function EditQuestion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await api.get(`/questions/${id}`);
        setQuestion(response.data);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id]);

  if (loading) {
    return (
      <div className="page-shell">
        <section className="panel">
          <p className="message">Loading question...</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <section className="panel">
          <p className="message error">{error}</p>
          <button type="button" className="button" onClick={() => navigate("/questions")}>
            Back to Questions
          </button>
        </section>
      </div>
    );
  }

  return <QuestionForm mode="edit" initialData={question} />;
}

export default EditQuestion;

