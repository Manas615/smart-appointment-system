import { useEffect, useState } from "react";
import { api } from "../api";

const statCards = [
    { key: "totalProviders", label: "Providers", icon: "👨‍⚕️", color: "#6366f1" },
    { key: "totalServices", label: "Services", icon: "🏥", color: "#0ea5e9" },
    { key: "totalAppointments", label: "Total Bookings", icon: "📅", color: "#10b981" },
    { key: "confirmedAppointments", label: "Confirmed", icon: "✅", color: "#22c55e" },
    { key: "cancelledAppointments", label: "Cancelled", icon: "❌", color: "#ef4444" },
    { key: "todayAppointments", label: "Today", icon: "📌", color: "#f59e0b" },
    { key: "availableSlots", label: "Open Slots", icon: "🕐", color: "#8b5cf6" },
    { key: "averageRating", label: "Avg Rating", icon: "⭐", color: "#ec4899", suffix: "/5" },
];

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);
    const [popular, setPopular] = useState([]);
    const [distribution, setDistribution] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.getDashboardStats(),
            api.getRecentAppointments(),
            api.getPopularProviders(),
            api.getSpecialtyDistribution(),
        ])
            .then(([s, r, p, d]) => {
                setStats(s);
                setRecent(r);
                setPopular(p);
                setDistribution(d);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading)
        return (
            <div className="page-container">
                <div className="loading-spinner">Loading dashboard...</div>
            </div>
        );

    const maxCount = Math.max(...distribution.map((d) => d.count), 1);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>📊 Dashboard</h1>
                <p>System analytics and appointment insights</p>
            </div>

            {/* Stats Grid */}
            <div className="dashboard-stats-grid">
                {statCards.map((card) => (
                    <div className="dashboard-stat-card" key={card.key}>
                        <div className="stat-card-icon" style={{ background: `${card.color}18`, color: card.color }}>
                            {card.icon}
                        </div>
                        <div className="stat-card-info">
                            <span className="stat-card-value">
                                {stats?.[card.key] ?? 0}{card.suffix || ""}
                            </span>
                            <span className="stat-card-label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                {/* Recent Appointments */}
                <div className="dashboard-panel">
                    <h2>🕐 Recent Appointments</h2>
                    {recent.length === 0 ? (
                        <p className="no-data">No appointments yet</p>
                    ) : (
                        <div className="recent-list">
                            {recent.map((a) => (
                                <div className="recent-item" key={a.id}>
                                    <div className="recent-item-main">
                                        <strong>{a.patient_name}</strong>
                                        <span className="recent-item-provider">→ {a.provider_name}</span>
                                    </div>
                                    <div className="recent-item-meta">
                                        <span>{a.date} • {a.start_time}</span>
                                        <span className={`status-badge-sm ${a.status}`}>
                                            {a.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Popular Providers */}
                <div className="dashboard-panel">
                    <h2>🏆 Provider Leaderboard</h2>
                    <div className="leaderboard">
                        {popular.map((p, i) => (
                            <div className="leaderboard-item" key={p.id}>
                                <span className="leaderboard-rank">#{i + 1}</span>
                                <div className="leaderboard-info">
                                    <strong>{p.name}</strong>
                                    <span className="specialty-tag">{p.specialty}</span>
                                </div>
                                <div className="leaderboard-stats">
                                    <span>{p.appointment_count} bookings</span>
                                    {p.avg_rating && <span>⭐ {p.avg_rating}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Specialty Distribution */}
                <div className="dashboard-panel">
                    <h2>📈 Bookings by Specialty</h2>
                    <div className="bar-chart">
                        {distribution.map((d) => (
                            <div className="bar-chart-row" key={d.specialty}>
                                <span className="bar-label">{d.specialty}</span>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill"
                                        style={{ width: `${(d.count / maxCount) * 100}%` }}
                                    />
                                </div>
                                <span className="bar-value">{d.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
