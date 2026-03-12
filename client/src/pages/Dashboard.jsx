import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-shell">
      <section className="panel dashboard-panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>Question Management Hub</h1>
          </div>
        </div>

        <div className="dashboard-grid">
          <button type="button" className="action-tile" onClick={() => navigate("/add-question")}>
            <span>Add Question</span>
            <p>Create new MCQ or NAT entries with optional diagrams.</p>
          </button>

          <button type="button" className="action-tile" onClick={() => navigate("/questions")}>
            <span>View Questions</span>
            <p>Review the question bank, edit entries, and remove outdated content.</p>
          </button>

          <button type="button" className="action-tile danger-tile" onClick={handleLogout}>
            <span>Logout</span>
            <p>Clear the local admin session and return to the PIN login page.</p>
          </button>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;

