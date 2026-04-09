import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const steps = ["Provider", "Service", "Date & Time", "Your Details", "Confirm"];

export default function Book() {
  const [searchParams] = useSearchParams();
  const preselectedProvider = searchParams.get("provider");
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [dates, setDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    provider: null,
    service: null,
    date: "",
    slot: null,
    patient_name: user?.name || "",
    patient_email: user?.email || "",
    notes: "",
  });

  useEffect(() => {
    api.getProviders().then((data) => {
      setProviders(data);
      if (preselectedProvider) {
        const found = data.find((p) => p.id === Number(preselectedProvider));
        if (found) {
          setForm((f) => ({ ...f, provider: found }));
          setStep(1);
        }
      }
    });
  }, [preselectedProvider]);

  useEffect(() => {
    if (form.provider) {
      setLoading(true);
      api
        .getServices(form.provider.id)
        .then(setServices)
        .finally(() => setLoading(false));
    }
  }, [form.provider]);

  useEffect(() => {
    if (form.provider) {
      api.getAvailableDates(form.provider.id).then(setDates);
    }
  }, [form.provider]);

  useEffect(() => {
    if (form.provider && form.date) {
      setLoading(true);
      api
        .getSlots(form.provider.id, form.date)
        .then(setSlots)
        .finally(() => setLoading(false));
    }
  }, [form.provider, form.date]);

  const selectProvider = (provider) => {
    setForm({ ...form, provider, service: null, date: "", slot: null });
    setStep(1);
  };

  const selectService = (service) => {
    setForm({ ...form, service });
    setStep(2);
  };

  const selectSlot = (slot) => {
    setForm({ ...form, slot });
    // If user already has name and email from login, skip the details step
    if (form.patient_name && form.patient_email) {
      setStep(3); // Go to details step but it will show as confirm-ready
    } else {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.bookAppointment({
        patient_name: form.patient_name,
        patient_email: form.patient_email,
        provider_id: form.provider.id,
        service_id: form.service.id,
        slot_id: form.slot.id,
        notes: form.notes,
      });
      setSuccess(result);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container">
        <div className="booking-success">
          <div className="success-icon">✅</div>
          <h2>Appointment Booked!</h2>
          <div className="success-details">
            <p>
              <strong>Provider:</strong> {success.provider_name}
            </p>
            <p>
              <strong>Service:</strong> {success.service_name}
            </p>
            <p>
              <strong>Date:</strong> {success.date}
            </p>
            <p>
              <strong>Time:</strong> {success.start_time} – {success.end_time}
            </p>
            <p>
              <strong>Patient:</strong> {success.patient_name}
            </p>
            <p>
              <strong>Status:</strong> <span className="status-badge confirmed">Confirmed</span>
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSuccess(null);
              setStep(0);
              setForm({
                provider: null,
                service: null,
                date: "",
                slot: null,
                patient_name: user?.name || "",
                patient_email: user?.email || "",
                notes: "",
              });
            }}
          >
            Book Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Book an Appointment</h1>
        <p>Follow the steps below to schedule your visit</p>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {steps.slice(0, 4).map((s, i) => (
          <div
            key={i}
            className={`step ${i === step ? "active" : ""} ${i < step ? "completed" : ""}`}
            onClick={() => i < step && setStep(i)}
          >
            <div className="step-circle">{i < step ? "✓" : i + 1}</div>
            <span className="step-label">{s}</span>
          </div>
        ))}
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      {/* Step 0: Select Provider */}
      {step === 0 && (
        <div className="booking-step">
          <h2>Select a Provider</h2>
          <div className="selection-grid">
            {providers.map((p) => (
              <button
                key={p.id}
                className={`selection-card ${form.provider?.id === p.id ? "selected" : ""}`}
                onClick={() => selectProvider(p)}
              >
                <h3>{p.name}</h3>
                <span className="specialty-tag">{p.specialty}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div className="booking-step">
          <h2>Select a Service</h2>
          <p className="step-context">
            Provider: <strong>{form.provider?.name}</strong>
          </p>
          {loading ? (
            <div className="loading-spinner">Loading services...</div>
          ) : (
            <div className="selection-grid">
              {services.map((s) => (
                <button
                  key={s.id}
                  className={`selection-card ${form.service?.id === s.id ? "selected" : ""}`}
                  onClick={() => selectService(s)}
                >
                  <h3>{s.name}</h3>
                  <div className="card-meta">
                    <span>{s.duration_minutes} min</span>
                    <span>Rs.{s.price}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div className="booking-step">
          <h2>Select Date & Time</h2>
          <p className="step-context">
            {form.provider?.name} — {form.service?.name}
          </p>

          <div className="date-picker">
            <h3>Available Dates</h3>
            <div className="date-chips">
              {dates.map((d) => (
                <button
                  key={d}
                  className={`date-chip ${form.date === d ? "selected" : ""}`}
                  onClick={() => setForm({ ...form, date: d, slot: null })}
                >
                  {new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </button>
              ))}
            </div>
          </div>

          {form.date && (
            <div className="time-picker">
              <h3>Available Slots</h3>
              {loading ? (
                <div className="loading-spinner">Loading slots...</div>
              ) : slots.length === 0 ? (
                <p className="no-data">No slots available for this date</p>
              ) : (
                <div className="time-chips">
                  {slots.map((s) => (
                    <button
                      key={s.id}
                      className={`time-chip ${form.slot?.id === s.id ? "selected" : ""}`}
                      onClick={() => selectSlot(s)}
                    >
                      {s.start_time} – {s.end_time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Patient Details + Summary + Confirm */}
      {step === 3 && (
        <div className="booking-step">
          <h2>Review & Confirm</h2>

          {/* Auto-filled info banner */}
          {user?.email && (
            <div className="autofill-banner">
              <span className="autofill-icon">👤</span>
              <span>Booking as <strong>{form.patient_name}</strong> ({form.patient_email})</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="patient_name">Full Name *</label>
            <input
              id="patient_name"
              type="text"
              placeholder="Enter your full name"
              value={form.patient_name}
              onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="patient_email">Email Address *</label>
            <input
              id="patient_email"
              type="email"
              placeholder="your.email@example.com"
              value={form.patient_email}
              onChange={(e) => setForm({ ...form, patient_email: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              placeholder="Any special requirements or notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="form-input"
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="booking-summary">
            <h3>Appointment Summary</h3>
            <div className="summary-row">
              <span>Provider</span>
              <span>{form.provider?.name}</span>
            </div>
            <div className="summary-row">
              <span>Specialty</span>
              <span>{form.provider?.specialty}</span>
            </div>
            <div className="summary-row">
              <span>Service</span>
              <span>{form.service?.name}</span>
            </div>
            <div className="summary-row">
              <span>Date</span>
              <span>{form.date}</span>
            </div>
            <div className="summary-row">
              <span>Time</span>
              <span>
                {form.slot?.start_time} – {form.slot?.end_time}
              </span>
            </div>
            <div className="summary-row">
              <span>Duration</span>
              <span>{form.service?.duration_minutes} min</span>
            </div>
            <div className="summary-row total">
              <span>Price</span>
              <span>Rs.{form.service?.price}</span>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg btn-block"
            disabled={!form.patient_name || !form.patient_email || loading}
            onClick={handleSubmit}
          >
            {loading ? "Booking..." : "✓ Confirm Booking"}
          </button>
        </div>
      )}
    </div>
  );
}
