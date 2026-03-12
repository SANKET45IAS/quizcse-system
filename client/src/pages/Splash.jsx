import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate("/home", { replace: true });
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="center-screen splash-screen">
      <div className="panel hero-panel">
        <p className="eyebrow">Engineering Quiz Platform</p>
        <h1>QuizCSE Admin Panel</h1>
        <p>Manage questions, diagrams, and answer formats from one clean workflow.</p>
      </div>
    </div>
  );
}

export default Splash;

