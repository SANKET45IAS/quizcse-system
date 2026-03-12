import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AddQuestion from "./pages/AddQuestion";
import Dashboard from "./pages/Dashboard";
import EditQuestion from "./pages/EditQuestion";
import Home from "./pages/Home";
import PinLogin from "./pages/PinLogin";
import Splash from "./pages/Splash";
import ViewQuestions from "./pages/ViewQuestions";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<PinLogin />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-question"
        element={
          <ProtectedRoute>
            <AddQuestion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions"
        element={
          <ProtectedRoute>
            <ViewQuestions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-question/:id"
        element={
          <ProtectedRoute>
            <EditQuestion />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

