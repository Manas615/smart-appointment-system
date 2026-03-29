import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "smartappoint_user";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [user]);

    const login = (userData) => {
        // userData: { name, email, role, providerId? }
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

// Role-based access config
export const ROLE_ACCESS = {
    client: ["/", "/providers", "/book", "/my-appointments"],
    receptionist: ["/", "/providers", "/book", "/dashboard", "/admin"],
    doctor: ["/", "/providers", "/dashboard", "/schedule"],
    admin: ["/", "/providers", "/book", "/my-appointments", "/dashboard", "/schedule", "/admin"],
};

export const ROLE_LABELS = {
    client: "Client",
    receptionist: "Receptionist",
    doctor: "Doctor",
    admin: "Admin",
};
