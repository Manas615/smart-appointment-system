import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth, ROLE_ACCESS, ROLE_LABELS } from "../context/AuthContext";

const allNavLinks = [
    { path: "/", label: "Home" },
    { path: "/providers", label: "Providers" },
    { path: "/book", label: "Book" },
    { path: "/my-appointments", label: "My Appointments" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/schedule", label: "Schedule" },
    { path: "/admin", label: "Admin" },
];

export default function Navbar() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuth();

    // Filter nav links based on user role
    const navLinks = user
        ? allNavLinks.filter((link) => ROLE_ACCESS[user.role]?.includes(link.path))
        : [];

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    <span className="brand-text">SmartAppoint</span>
                </Link>

                <div className="navbar-actions">
                    <ThemeToggle />
                    {user && (
                        <div className="navbar-user">
                            <span className="user-role-badge" data-role={user.role}>
                                {ROLE_LABELS[user.role]}
                            </span>
                            <span className="user-name">{user.name}</span>
                            <button className="btn btn-outline btn-sm logout-btn" onClick={logout}>
                                Logout
                            </button>
                        </div>
                    )}
                    <button
                        className="mobile-toggle"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation"
                    >
                        {mobileOpen ? "✕" : "☰"}
                    </button>
                </div>

                <div className={`navbar-links ${mobileOpen ? "open" : ""}`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
