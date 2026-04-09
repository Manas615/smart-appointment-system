import { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function Schedule() {
  const { user } = useAuth();
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const providerId = user?.providerId;

  // Load upcoming appointments for this provider
  useEffect(() => {
    if (!providerId) return;
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const data = await api.getProviderSchedule(providerId, selectedDate || null);
        setAppointments(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [providerId, selectedDate, toast]);

  // Load slots for the selected date
  useEffect(() => {
    if (!providerId || !selectedDate) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const data = await api.getAllSlots(providerId, selectedDate);
        setSlots(data);
      } catch {
        // ignore
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [providerId, selectedDate]);

  const deleteSlot = async (slotId) => {
    if (!window.confirm("Remove this time slot?")) return;
    try {
      await api.deleteSlot(slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      toast.success("Slot removed");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Generate next 14 day options
  const dateOptions = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dateOptions.push(d.toISOString().split("T")[0]);
  }

  if (!providerId) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Schedule view is only available for providers. Please log in as a doctor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Schedule</h1>
        <p>View your daily appointments and manage time slots</p>
      </div>

      {/* Date Filter */}
      <div className="schedule-date-bar">
        <button
          className={`date-chip ${selectedDate === "" ? "active" : ""}`}
          onClick={() => setSelectedDate("")}
        >
          All Upcoming
        </button>
        {dateOptions.map((d) => (
          <button
            key={d}
            className={`date-chip ${selectedDate === d ? "active" : ""}`}
            onClick={() => setSelectedDate(d)}
          >
            {new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </button>
        ))}
      </div>

      <div className="schedule-grid">
        {/* Appointments Panel */}
        <div className="schedule-panel">
          <h2>
            Appointments
            {selectedDate && ` - ${selectedDate}`}
            <span className="count-badge">{appointments.length}</span>
          </h2>

          {loading ? (
            <div className="loading-spinner">Loading schedule...</div>
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <p>No appointments {selectedDate ? "on this date" : "upcoming"}</p>
            </div>
          ) : (
            <div className="schedule-list">
              {appointments.map((a) => (
                <div className="schedule-item" key={a.id}>
                  <div className="schedule-time">
                    <span className="time-slot">
                      {a.start_time} - {a.end_time}
                    </span>
                    <span className="schedule-date">{a.date}</span>
                  </div>
                  <div className="schedule-info">
                    <strong>{a.patient_name}</strong>
                    <span>{a.service_name}</span>
                    <span className="schedule-meta">
                      {a.duration_minutes} min - Rs.{a.price}
                    </span>
                    {a.notes && <span className="schedule-notes">{a.notes}</span>}
                  </div>
                  <span className="status-badge confirmed">Confirmed</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slots Panel (only when date is selected) */}
        {selectedDate && (
          <div className="schedule-panel">
            <h2>
              Time Slots
              <span className="count-badge">{slots.length}</span>
            </h2>

            {slotsLoading ? (
              <div className="loading-spinner">Loading slots...</div>
            ) : slots.length === 0 ? (
              <p className="no-data">No slots for this date</p>
            ) : (
              <div className="slots-manage-list">
                {slots.map((s) => (
                  <div
                    className={`slot-manage-item ${s.is_available ? "available" : "booked"}`}
                    key={s.id}
                  >
                    <span>
                      {s.start_time} - {s.end_time}
                    </span>
                    <span className={`slot-status ${s.is_available ? "open" : "taken"}`}>
                      {s.is_available ? "Available" : "Booked"}
                    </span>
                    {s.is_available ? (
                      <button className="btn btn-danger btn-sm" onClick={() => deleteSlot(s.id)}>
                        Remove
                      </button>
                    ) : (
                      <span className="slot-locked">Locked</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
