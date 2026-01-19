import { useState } from 'react'
import axios from 'axios'

function App() {
  const [formData, setFormData] = useState({
    provider_id: "Dr_Smith",
    user_id: "User_1",
    start_time: "2025-12-01T10:00:00",
    end_time: "2025-12-01T11:00:00",
    reason: "Checkup"
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Booking...");
    setError(false);
    
    try {
      // Connects to Backend Service
      const res = await axios.post("http://localhost:8000/api/v1/appointments/", formData);
      setMessage(`Success! ID: ${res.data.id} - Status: ${res.data.status}`);
    } catch (err) {
      setError(true);
      if (err.response && err.response.status === 409) {
        setMessage("Conflict: This slot is already booked!");
      } else {
        setMessage("Error: " + err.message);
      }
    }
  };

  return (
    <div className="container">
      <h1>📅 Smart Appointment System</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Provider ID:</label>
            <input name="provider_id" value={formData.provider_id} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>User ID:</label>
            <input name="user_id" value={formData.user_id} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Start Time (ISO):</label>
            <input name="start_time" value={formData.start_time} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>End Time (ISO):</label>
            <input name="end_time" value={formData.end_time} onChange={handleChange} />
          </div>
          <button type="submit">Book Appointment</button>
        </form>
      </div>

      {message && (
        <div className={`message ${error ? "error" : "success"}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default App
