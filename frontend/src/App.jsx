import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import { AuthProvider, useAuth, ROLE_ACCESS } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Providers from "./pages/Providers";
import Book from "./pages/Book";
import MyAppointments from "./pages/MyAppointments";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import "./App.css";

function ProtectedRoute({ path, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowed = ROLE_ACCESS[user.role] || [];
  if (!allowed.includes(path)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute path="/">
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/providers"
        element={
          <ProtectedRoute path="/providers">
            <Providers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book"
        element={
          <ProtectedRoute path="/book">
            <Book />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-appointments"
        element={
          <ProtectedRoute path="/my-appointments">
            <MyAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute path="/dashboard">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute path="/schedule">
            <Schedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute path="/admin">
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <AppRoutes />
            </main>
            <footer className="app-footer">
              <p>© 2026 SmartAppoint — Smart Appointment & Resource Allocation System</p>
            </footer>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
