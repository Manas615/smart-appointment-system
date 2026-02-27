import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Providers from "./pages/Providers";
import Book from "./pages/Book";
import MyAppointments from "./pages/MyAppointments";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/book" element={<Book />} />
              <Route path="/my-appointments" element={<MyAppointments />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>© 2026 SmartAppoint — Smart Appointment & Resource Allocation System</p>
          </footer>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
