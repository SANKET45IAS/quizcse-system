import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_PIN = "9465";

function PinLogin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("auth") === "true") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (pin === ADMIN_PIN) {
      localStorage.setItem("auth", "true");
      navigate("/dashboard", { replace: true });
      return;
    }

    setError("Incorrect PIN. Please try again.");
  };

  return (
    <div className="center-screen">
      <form className="panel auth-panel" onSubmit={handleSubmit}>
        <p className="eyebrow">Administrator Access</p>
        <h1>Enter PIN</h1>
        <p>Use the 4-digit admin PIN to access the protected question management routes.</p>

        <label className="field">
          <span>PIN</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(event) => {
              setPin(event.target.value);
              setError("");
            }}
            placeholder="Enter 4-digit PIN"
          />
        </label>

        {error && <p className="message error">{error}</p>}

        <div className="button-row">
          <button type="submit" className="button">
            Verify PIN
          </button>
          <button type="button" className="button ghost" onClick={() => navigate("/home")}>
            Back
          </button>
        </div>
      </form>
    </div>
  );
}

export default PinLogin;
