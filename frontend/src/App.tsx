import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ComposeEmail from "./pages/ComposeEmail";
import ScheduledEmails from "./pages/ScheduledEmails";
import SentEmails from "./pages/SentEmails";
import AuthCallback from "./pages/AuthCallback";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/auth/callback"
            element={<AuthCallback />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/compose"
            element={<ComposeEmail />}
          />

          <Route
            path="/scheduled"
            element={<ScheduledEmails />}
          />

          <Route
            path="/sent"
            element={<SentEmails />}
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;