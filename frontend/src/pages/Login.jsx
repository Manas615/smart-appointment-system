import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const roles = [
    {
        key: "client",
        label: "Client",
        description: "Book appointments, view your history, and manage your visits.",
        color: "#6366f1",
    },
    {
        key: "receptionist",
        label: "Receptionist",
        description: "Manage bookings, view the dashboard, and assist patients.",
        color: "#0ea5e9",
    },
    {
        key: "doctor",
        label: "Doctor",
        description: "View your schedule, check the dashboard, and manage availability.",
        color: "#10b981",
    },
    {
        key: "admin",
        label: "Admin",
        description: "Full system access: manage providers, view reports, and monitor activity.",
        color: "#f59e0b",
    },
];

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [providers, setProviders] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState("");

    useEffect(() => {
        api.getProviders().then(setProviders).catch(() => { });
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (!selectedRole || !name.trim()) return;

        const userData = {
            name: name.trim(),
            email: email.trim(),
            role: selectedRole,
        };

        if (selectedRole === "doctor" && selectedProvider) {
            userData.providerId = Number(selectedProvider);
        }

        login(userData);
        navigate("/");
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>Welcome to SmartAppoint</h1>
                    <p>Select your role to continue</p>
                </div>

                {/* Role Selection */}
                <div className="role-cards">
                    {roles.map((role) => (
                        <button
                            key={role.key}
                            className={`role-card ${selectedRole === role.key ? "selected" : ""}`}
                            onClick={() => setSelectedRole(role.key)}
                            style={
                                selectedRole === role.key
                                    ? { borderColor: role.color, boxShadow: `0 0 0 2px ${role.color}30` }
                                    : {}
                            }
                        >
                            <div className="role-card-icon" style={{ background: `${role.color}18`, color: role.color }}>
                                {role.label.charAt(0)}
                            </div>
                            <h3>{role.label}</h3>
                            <p>{role.description}</p>
                        </button>
                    ))}
                </div>

                {/* Login Form */}
                {selectedRole && (
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="login-name">Your Name *</label>
                            <input
                                id="login-name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="login-email">Email Address</label>
                            <input
                                id="login-email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                            />
                        </div>

                        {selectedRole === "doctor" && (
                            <div className="form-group">
                                <label htmlFor="login-provider">Select Your Profile</label>
                                <select
                                    id="login-provider"
                                    value={selectedProvider}
                                    onChange={(e) => setSelectedProvider(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="">-- Select Provider --</option>
                                    {providers.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} — {p.specialty}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!name.trim()}>
                            Continue as {roles.find((r) => r.key === selectedRole)?.label}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
