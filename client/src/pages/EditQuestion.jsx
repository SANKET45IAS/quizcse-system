import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import QuestionForm from "../components/QuestionForm";
import api, { getApiErrorMessage } from "../services/api";
import { rememberSubject } from "../utils/subjectPreference";

function EditQuestion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic") || "";
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/questions/${id}`, {
          params: topic ? { topic } : undefined,
        });

        rememberSubject(response.data.topic);
        setQuestion(response.data);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id, topic]);

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

  return <QuestionForm key={`${question?._id}-${question?.topic}`} mode="edit" initialData={question} />;
}

export default EditQuestion;
