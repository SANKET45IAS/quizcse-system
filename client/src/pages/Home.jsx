import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <section className="panel hero-grid">
        <div>
          <p className="eyebrow">Welcome</p>
          <h1>Build and maintain your CSE quiz bank</h1>
          <p className="hero-copy">
            Add MCQ and NAT questions, attach diagrams, and keep your engineering question
            repository organized from a single admin panel.
          </p>
          <div className="button-row">
            <button type="button" className="button" onClick={() => navigate("/login")}>
              Enter PIN
            </button>
          </div>
          <p className="message">Admin PIN: XXXX</p>
        </div>

        <div className="feature-stack">
          <div className="feature-card">
            <h2>MCQ + NAT Support</h2>
            <p>Store both multiple-choice and numeric-answer questions with tailored fields.</p>
          </div>
          <div className="feature-card">
            <h2>Diagram Uploads</h2>
            <p>Attach images for the question statement, options, and explanations.</p>
          </div>
          <div className="feature-card">
            <h2>Fast Admin Workflow</h2>
            <p>Log in with a PIN, review the bank, and edit content without leaving the dashboard.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
