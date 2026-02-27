import { Link } from "react-router-dom";

const features = [
    {
        title: "Easy Scheduling",
        desc: "Browse available providers and book appointments in just a few clicks.",
    },
    {
        title: "Real-Time Availability",
        desc: "See live time slots and never worry about double bookings.",
    },
    {
        title: "Instant Confirmation",
        desc: "Get immediate booking confirmation with all appointment details.",
    },
    {
        title: "Easy Cancellation",
        desc: "Cancel or reschedule appointments hassle-free whenever you need.",
    },
    {
        title: "Expert Providers",
        desc: "Choose from a wide range of qualified specialists across fields.",
    },
    {
        title: "Track History",
        desc: "View your complete appointment history and manage upcoming visits.",
    },
];

export default function Home() {
    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                </div>
                <div className="hero-content">
                    <span className="hero-badge">Smart Scheduling Platform</span>
                    <h1 className="hero-title">
                        Book Appointments
                        <br />
                        <span className="gradient-text">Effortlessly</span>
                    </h1>
                    <p className="hero-subtitle">
                        A modern appointment management system that connects you with the
                        right providers at the right time. No conflicts, no hassle.
                    </p>
                    <div className="hero-actions">
                        <Link to="/book" className="btn btn-primary btn-lg">
                            Book Now
                        </Link>
                        <Link to="/providers" className="btn btn-outline btn-lg">
                            View Providers
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-number">6+</span>
                            <span className="stat-label">Specialists</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">12</span>
                            <span className="stat-label">Daily Slots</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">24/7</span>
                            <span className="stat-label">Online Booking</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2 className="section-title">Why Choose Us</h2>
                <p className="section-subtitle">
                    Everything you need for seamless appointment management
                </p>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <h2>Ready to Get Started?</h2>
                <p>Book your first appointment today and experience hassle-free scheduling.</p>
                <Link to="/book" className="btn btn-primary btn-lg">
                    Book Your Appointment
                </Link>
            </section>
        </div>
    );
}
