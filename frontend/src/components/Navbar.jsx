import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/providers", label: "Providers", icon: "👨‍⚕️" },
    { path: "/book", label: "Book", icon: "📅" },
    { path: "/my-appointments", label: "My Appointments", icon: "📋" },
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
];

export default function Navbar() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon">⚡</span>
                    <span className="brand-text">SmartAppoint</span>
                </Link>

                <div className="navbar-actions">
                    <ThemeToggle />
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
                            <span className="nav-icon">{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
