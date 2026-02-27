import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const specialtyColors = {
    "General Medicine": "#3b82f6",
    Dentistry: "#10b981",
    Dermatology: "#f59e0b",
    Orthopedics: "#ef4444",
    Pediatrics: "#8b5cf6",
    Cardiology: "#ec4899",
};

export default function Providers() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("All");
    const [reviews, setReviews] = useState({});

    useEffect(() => {
        api
            .getProviders()
            .then(async (data) => {
                setProviders(data);
                const reviewData = {};
                await Promise.all(
                    data.map(async (p) => {
                        try {
                            const r = await api.getProviderReviews(p.id);
                            reviewData[p.id] = r.stats;
                        } catch {
                            reviewData[p.id] = { count: 0, average: null };
                        }
                    })
                );
                setReviews(reviewData);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const specialties = useMemo(() => {
        const set = new Set(providers.map((p) => p.specialty));
        return ["All", ...Array.from(set).sort()];
    }, [providers]);

    const filtered = useMemo(() => {
        return providers.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.specialty.toLowerCase().includes(search.toLowerCase()) ||
                (p.bio && p.bio.toLowerCase().includes(search.toLowerCase()));
            const matchesSpecialty =
                selectedSpecialty === "All" || p.specialty === selectedSpecialty;
            return matchesSearch && matchesSpecialty;
        });
    }, [providers, search, selectedSpecialty]);

    if (loading)
        return (
            <div className="page-container">
                <div className="loading-spinner">Loading providers...</div>
            </div>
        );

    if (error)
        return (
            <div className="page-container">
                <div className="error-message">Error: {error}</div>
            </div>
        );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Our Providers</h1>
                <p>Choose from our team of experienced healthcare professionals</p>
            </div>

            {/* Search & Filter Bar */}
            <div className="search-filter-bar">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by name, specialty, or keywords..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    {search && (
                        <button className="search-clear" onClick={() => setSearch("")}>✕</button>
                    )}
                </div>
                <div className="filter-pills">
                    {specialties.map((s) => (
                        <button
                            key={s}
                            className={`filter-pill ${selectedSpecialty === s ? "active" : ""}`}
                            onClick={() => setSelectedSpecialty(s)}
                            style={
                                selectedSpecialty === s && s !== "All"
                                    ? { background: specialtyColors[s], color: "#fff" }
                                    : {}
                            }
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <p>No providers match your search criteria</p>
                    <button className="btn btn-outline" onClick={() => { setSearch(""); setSelectedSpecialty("All"); }}>
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="providers-grid">
                    {filtered.map((provider) => {
                        const r = reviews[provider.id];
                        return (
                            <div className="provider-card" key={provider.id}>
                                <div
                                    className="provider-card-accent"
                                    style={{
                                        background: specialtyColors[provider.specialty] || "#6366f1",
                                    }}
                                />
                                <div className="provider-card-body">
                                    <div
                                        className="provider-avatar"
                                        style={{
                                            background: `${specialtyColors[provider.specialty] || "#6366f1"}20`,
                                            color: specialtyColors[provider.specialty] || "#6366f1",
                                        }}
                                    >
                                        {provider.name.charAt(0)}
                                    </div>
                                    <h3 className="provider-name">{provider.name}</h3>
                                    <span
                                        className="specialty-badge"
                                        style={{
                                            background: `${specialtyColors[provider.specialty] || "#6366f1"}20`,
                                            color: specialtyColors[provider.specialty] || "#6366f1",
                                        }}
                                    >
                                        {provider.specialty}
                                    </span>
                                    {r && r.count > 0 && (
                                        <div className="provider-rating">
                                            <span className="stars">
                                                {"★".repeat(Math.round(r.average || 0))}
                                                {"☆".repeat(5 - Math.round(r.average || 0))}
                                            </span>
                                            <span className="rating-text">
                                                {r.average} ({r.count} review{r.count !== 1 ? "s" : ""})
                                            </span>
                                        </div>
                                    )}
                                    <p className="provider-bio">{provider.bio}</p>
                                    <div className="provider-contact">
                                        <span>{provider.email}</span>
                                        {provider.phone && <span>{provider.phone}</span>}
                                    </div>
                                    <Link
                                        to={`/book?provider=${provider.id}`}
                                        className="btn btn-primary btn-block"
                                    >
                                        Book Appointment
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
