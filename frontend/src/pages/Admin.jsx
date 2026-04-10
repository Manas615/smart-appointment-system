import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";

const TABS = ["Appointments", "Providers", "Reports", "Activity"];

export default function Admin() {
  const [activeTab, setActiveTab] = useState("Appointments");

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Manage system resources and view reports</p>
      </div>

      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === "Appointments" && <AppointmentsTab />}
        {activeTab === "Providers" && <ProvidersTab />}
        {activeTab === "Reports" && <ReportsTab />}
        {activeTab === "Activity" && <ActivityTab />}
      </div>
    </div>
  );
}

/* ─── Appointments Tab (Issue #16) ─── */
function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const toast = useToast();

  useEffect(() => {
    api
      .adminGetAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const deleteAppointment = async (id) => {
    if (!window.confirm("Delete this appointment permanently?")) return;
    try {
      await api.adminDeleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Appointment deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered =
    filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  if (loading) return <div className="loading-spinner">Loading appointments...</div>;

  return (
    <div>
      <div className="admin-filter-bar">
        {["all", "confirmed", "cancelled"].map((f) => (
          <button
            key={f}
            className={`filter-pill ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="pill-count">
              {f === "all"
                ? appointments.length
                : appointments.filter((a) => a.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Provider</th>
              <th>Service</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td>
                  <div>{a.patient_name}</div>
                  <small>{a.patient_email}</small>
                </td>
                <td>{a.provider_name}</td>
                <td>{a.service_name}</td>
                <td>{a.date}</td>
                <td>
                  {a.start_time} - {a.end_time}
                </td>
                <td>
                  <span className={`status-badge-sm ${a.status}`}>{a.status}</span>
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteAppointment(a.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No appointments found</p>
        </div>
      )}
    </div>
  );
}

/* ─── Providers Tab (Issue #17) ─── */
function ProvidersTab() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({ name: "", specialty: "", email: "", phone: "", bio: "" });
  const toast = useToast();

  const loadProviders = useCallback(() => {
    api
      .getProviders()
      .then(setProviders)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const openEdit = (p) => {
    setForm({
      name: p.name,
      specialty: p.specialty,
      email: p.email,
      phone: p.phone || "",
      bio: p.bio || "",
    });
    setEditModal(p);
  };

  const saveEdit = async () => {
    try {
      await api.adminUpdateProvider(editModal.id, form);
      toast.success("Provider updated");
      setEditModal(null);
      loadProviders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteProvider = async (id) => {
    if (!window.confirm("Delete this provider? This cannot be undone.")) return;
    try {
      await api.adminDeleteProvider(id);
      setProviders((prev) => prev.filter((p) => p.id !== id));
      toast.success("Provider deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="loading-spinner">Loading providers...</div>;

  return (
    <div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Specialty</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td>{p.name}</td>
                <td>
                  <span className="specialty-tag">{p.specialty}</span>
                </td>
                <td>{p.email}</td>
                <td>{p.phone || "—"}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteProvider(p.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Provider</h2>
            {["name", "specialty", "email", "phone", "bio"].map((field) => (
              <div className="form-group" key={field}>
                <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                {field === "bio" ? (
                  <textarea
                    className="form-input"
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <input
                    className="form-input"
                    type={field === "email" ? "email" : "text"}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditModal(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Reports Tab (Issue #18) ─── */
function ReportsTab() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminGetReports()
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading reports...</div>;
  if (!report)
    return (
      <div className="empty-state">
        <p>Could not load reports</p>
      </div>
    );

  const maxProviderCount = Math.max(...report.bookingsByProvider.map((p) => p.count), 1);

  return (
    <div className="reports-grid">
      {/* Summary Cards */}
      <div className="report-summary-row">
        <div className="report-card highlight">
          <span className="report-card-value">Rs.{report.totalRevenue.toLocaleString()}</span>
          <span className="report-card-label">Total Revenue</span>
        </div>
        <div className="report-card">
          <span className="report-card-value">{report.cancellationRate}%</span>
          <span className="report-card-label">Cancellation Rate</span>
        </div>
      </div>

      {/* Bookings by Provider */}
      <div className="report-panel">
        <h3>Revenue by Provider</h3>
        <div className="bar-chart">
          {report.bookingsByProvider.map((p) => (
            <div className="bar-chart-row" key={p.name}>
              <span className="bar-label">
                {p.name}
                <small>{p.specialty}</small>
              </span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(p.count / maxProviderCount) * 100}%` }}
                />
              </div>
              <span className="bar-value">
                {p.count} / Rs.{p.revenue.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Services */}
      <div className="report-panel">
        <h3>Top Services</h3>
        <div className="admin-table-wrap">
          <table className="admin-table compact">
            <thead>
              <tr>
                <th>Service</th>
                <th>Bookings</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {report.bookingsByService.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.count}</td>
                  <td>Rs.{s.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookings Timeline */}
      <div className="report-panel">
        <h3>Recent Booking Trend</h3>
        <div className="timeline-chart">
          {report.bookingsByDate
            .slice(0, 14)
            .reverse()
            .map((d) => (
              <div className="timeline-bar" key={d.date}>
                <div
                  className="timeline-fill"
                  style={{ height: `${Math.max((d.count / 10) * 100, 8)}%` }}
                />
                <span className="timeline-label">{d.date.slice(5)}</span>
                <span className="timeline-value">{d.count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Activity Tab (Issue #19) ─── */
function ActivityTab() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminGetActivity()
      .then(setActivity)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading activity...</div>;

  const formatAction = (item) => {
    if (item.type === "review") {
      return `Left a ${item.rating}-star review for ${item.provider_name}`;
    }
    if (item.status === "cancelled") {
      return `Cancelled appointment with ${item.provider_name}`;
    }
    return `Booked ${item.service_name} with ${item.provider_name}`;
  };

  return (
    <div>
      {activity.length === 0 ? (
        <div className="empty-state">
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="activity-feed">
          {activity.map((item, i) => (
            <div className="activity-item" key={`${item.type}-${item.id}-${i}`}>
              <div className={`activity-dot ${item.type}`} />
              <div className="activity-content">
                <div className="activity-header">
                  <strong>{item.actor}</strong>
                  <span className={`activity-type-badge ${item.type}`}>
                    {item.type === "review" ? "Review" : "Appointment"}
                  </span>
                </div>
                <p>{formatAction(item)}</p>
                <time>{new Date(item.timestamp).toLocaleString()}</time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
