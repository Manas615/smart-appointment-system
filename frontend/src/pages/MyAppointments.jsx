import { useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";

export default function MyAppointments() {
    const [email, setEmail] = useState("");
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [rescheduleModal, setRescheduleModal] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedNewSlot, setSelectedNewSlot] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [availableDates, setAvailableDates] = useState([]);
    const toast = useToast();

    const lookup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);
        try {
            const data = await api.getAppointments(email);
            setAppointments(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const cancelAppointment = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
        try {
            await api.cancelAppointment(id);
            toast.success("Appointment cancelled successfully");
            setAppointments((prev) =>
                prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
            );
        } catch (err) {
            toast.error(err.message);
        }
    };

    const submitReview = async () => {
        try {
            await api.submitReview({
                appointment_id: reviewModal,
                rating: reviewRating,
                comment: reviewComment,
            });
            toast.success("Review submitted! Thank you for your feedback.");
            setReviewModal(null);
            setReviewComment("");
            setReviewRating(5);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const openReschedule = async (appointment) => {
        setRescheduleModal(appointment);
        setSelectedNewSlot(null);
        setRescheduleDate("");
        try {
            const dates = await api.getAvailableDates(appointment.provider_id);
            setAvailableDates(dates);
        } catch (err) {
            toast.error("Could not load available dates");
        }
    };

    const loadSlotsForDate = async (date) => {
        setRescheduleDate(date);
        setSelectedNewSlot(null);
        try {
            const slots = await api.getSlots(rescheduleModal.provider_id, date);
            setAvailableSlots(slots);
        } catch (err) {
            toast.error("Could not load time slots");
        }
    };

    const doReschedule = async () => {
        if (!selectedNewSlot) return;
        try {
            const updated = await api.rescheduleAppointment(rescheduleModal.id, selectedNewSlot);
            toast.success("Appointment rescheduled successfully!");
            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === rescheduleModal.id
                        ? { ...a, date: updated.date, start_time: updated.start_time, end_time: updated.end_time, slot_id: updated.slot_id }
                        : a
                )
            );
            setRescheduleModal(null);
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>My Appointments</h1>
                <p>Look up your appointments by email address</p>
            </div>

            <form onSubmit={lookup} className="lookup-form">
                <div className="lookup-input-group">
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="lookup-input"
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Searching..." : "Look Up"}
                    </button>
                </div>
            </form>

            {searched && !loading && appointments.length === 0 && (
                <div className="empty-state">
                    <p>No appointments found for this email</p>
                </div>
            )}

            <div className="appointments-list">
                {appointments.map((a) => (
                    <div className={`appointment-card ${a.status}`} key={a.id}>
                        <div className="appointment-header">
                            <h3>{a.service_name}</h3>
                            <span className={`status-badge ${a.status}`}>
                                {a.status === "confirmed" ? "Confirmed" : "Cancelled"}
                            </span>
                        </div>
                        <div className="appointment-details">
                            <div className="detail-row">
                                <span className="detail-label">Provider</span>
                                <span>{a.provider_name} · {a.specialty}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date & Time</span>
                                <span>{a.date} • {a.start_time} – {a.end_time}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Price</span>
                                <span>${a.price} · {a.duration_minutes} min</span>
                            </div>
                            {a.notes && (
                                <div className="detail-row">
                                    <span className="detail-label">Notes</span>
                                    <span>{a.notes}</span>
                                </div>
                            )}
                        </div>
                        {a.status === "confirmed" && (
                            <div className="appointment-actions">
                                <button className="btn btn-outline" onClick={() => openReschedule(a)}>
                                    Reschedule
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={() => setReviewModal(a.id)}>
                                    Leave Review
                                </button>
                                <button className="btn btn-danger" onClick={() => cancelAppointment(a.id)}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Review Modal */}
            {reviewModal && (
                <div className="modal-overlay" onClick={() => setReviewModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Leave a Review</h2>
                        <div className="star-picker">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className={`star-btn ${star <= reviewRating ? "active" : ""}`}
                                    onClick={() => setReviewRating(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <textarea
                            placeholder="Share your experience (optional)..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="review-textarea"
                            rows={4}
                        />
                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setReviewModal(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={submitReview}>
                                Submit Review
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {rescheduleModal && (
                <div className="modal-overlay" onClick={() => setRescheduleModal(null)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <h2>Reschedule Appointment</h2>
                        <p className="modal-subtitle">Select a new date and time</p>

                        <div className="reschedule-dates">
                            <label className="form-label">Available Dates</label>
                            <div className="date-chips">
                                {availableDates.map((d) => (
                                    <button
                                        key={d}
                                        className={`date-chip ${rescheduleDate === d ? "active" : ""}`}
                                        onClick={() => loadSlotsForDate(d)}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {rescheduleDate && (
                            <div className="reschedule-slots">
                                <label className="form-label">Available Slots</label>
                                <div className="slot-grid-compact">
                                    {availableSlots.length === 0 ? (
                                        <p>No slots available on this date</p>
                                    ) : (
                                        availableSlots.map((s) => (
                                            <button
                                                key={s.id}
                                                className={`slot-chip ${selectedNewSlot === s.id ? "active" : ""}`}
                                                onClick={() => setSelectedNewSlot(s.id)}
                                            >
                                                {s.start_time} – {s.end_time}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setRescheduleModal(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={doReschedule}
                                disabled={!selectedNewSlot}
                            >
                                Confirm Reschedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
