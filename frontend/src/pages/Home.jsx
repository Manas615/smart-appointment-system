import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";

const features = [
  {
    icon: "📅",
    title: "Easy Scheduling",
    desc: "Browse available providers and book appointments in just a few clicks.",
  },
  {
    icon: "⚡",
    title: "Real-Time Availability",
    desc: "See live time slots and never worry about double bookings.",
  },
  {
    icon: "✅",
    title: "Instant Confirmation",
    desc: "Get immediate booking confirmation with all appointment details.",
  },
  {
    icon: "🔄",
    title: "Easy Rescheduling",
    desc: "Cancel or reschedule appointments hassle-free whenever you need.",
  },
  {
    icon: "🩺",
    title: "Expert Providers",
    desc: "Choose from a wide range of qualified specialists across fields.",
  },
  {
    icon: "📊",
    title: "Track History",
    desc: "View your complete appointment history and manage upcoming visits.",
  },
];

const howItWorks = [
  {
    step: "01",
    icon: "🔍",
    title: "Browse Providers",
    desc: "Explore our wide range of specialists and find the right doctor for your needs.",
  },
  {
    step: "02",
    icon: "🗓️",
    title: "Pick a Time",
    desc: "Choose from available dates and time slots that work best for your schedule.",
  },
  {
    step: "03",
    icon: "🎉",
    title: "Get Confirmed",
    desc: "Receive instant confirmation and manage your appointment easily.",
  },
];

const specialtyData = [
  { name: "General Medicine", icon: "🏥", color: "#3b82f6" },
  { name: "Dentistry", icon: "🦷", color: "#10b981" },
  { name: "Dermatology", icon: "✨", color: "#f59e0b" },
  { name: "Orthopedics", icon: "🦴", color: "#ef4444" },
  { name: "Pediatrics", icon: "👶", color: "#8b5cf6" },
  { name: "Cardiology", icon: "❤️", color: "#ec4899" },
  { name: "Neurology", icon: "🧠", color: "#06b6d4" },
  { name: "ENT", icon: "👂", color: "#84cc16" },
  { name: "Ophthalmology", icon: "👁️", color: "#14b8a6" },
  { name: "Psychiatry", icon: "🧘", color: "#a855f7" },
  { name: "Gynecology", icon: "🌸", color: "#f43f5e" },
];

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === null || target === undefined) return;
    const num = typeof target === "string" ? parseFloat(target) : target;
    if (isNaN(num)) return;

    const duration = 1500;
    const steps = 40;
    const increment = num / steps;
    let current = 0;
    let i = 0;

    const timer = setInterval(() => {
      i++;
      current = Math.min(current + increment, num);
      setCount(Math.round(current * 10) / 10);
      if (i >= steps) {
        setCount(num);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {typeof target === "string" && isNaN(target) ? target : count}
      {suffix}
    </span>
  );
}

export default function Home() {
  const [stats, setStats] = useState(null);
  const [topReviews, setTopReviews] = useState([]);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(() => {});

    // Fetch popular providers to get reviews
    api
      .getPopularProviders()
      .then(async (providers) => {
        const allReviews = [];
        for (const p of providers.slice(0, 5)) {
          try {
            const data = await api.getProviderReviews(p.id);
            if (data.reviews) {
              data.reviews.forEach((r) => {
                allReviews.push({ ...r, providerName: p.name, specialty: p.specialty });
              });
            }
          } catch {
            // skip
          }
        }
        // Sort by rating and pick top 6
        setTopReviews(
          allReviews
            .filter((r) => r.rating >= 4 && r.comment)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6)
        );
      })
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
        <div className="hero-content">
          <span className="hero-badge">🏥 Smart Scheduling Platform</span>
          <h1 className="hero-title">
            Book Appointments
            <br />
            <span className="gradient-text">Effortlessly</span>
          </h1>
          <p className="hero-subtitle">
            A modern appointment management system that connects you with the right providers at the
            right time. No conflicts, no hassle — just seamless healthcare.
          </p>
          <div className="hero-actions">
            <Link to="/book" className="btn btn-primary btn-lg hero-btn-glow">
              📅 Book Now
            </Link>
            <Link to="/providers" className="btn btn-outline btn-lg">
              🩺 View Providers
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">
                {stats ? <AnimatedCounter target={stats.totalProviders} suffix="+" /> : "60+"}
              </span>
              <span className="stat-label">Specialists</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {stats ? (
                  <AnimatedCounter target={stats.totalAppointments} />
                ) : (
                  "100+"
                )}
              </span>
              <span className="stat-label">Bookings</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {stats ? <AnimatedCounter target={11} /> : "11"}
              </span>
              <span className="stat-label">Specialties</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {stats?.averageRating ? (
                  <AnimatedCounter target={stats.averageRating} suffix="/5" />
                ) : (
                  "4.5/5"
                )}
              </span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Bar */}
      {stats && (
        <section className="live-stats-section">
          <div className="live-stats-grid">
            <div className="live-stat-card">
              <div className="live-stat-icon" style={{ background: "#6366f120", color: "#6366f1" }}>🩺</div>
              <div className="live-stat-info">
                <span className="live-stat-value">{stats.totalProviders}</span>
                <span className="live-stat-label">Active Providers</span>
              </div>
            </div>
            <div className="live-stat-card">
              <div className="live-stat-icon" style={{ background: "#10b98120", color: "#10b981" }}>📋</div>
              <div className="live-stat-info">
                <span className="live-stat-value">{stats.totalServices}</span>
                <span className="live-stat-label">Services Available</span>
              </div>
            </div>
            <div className="live-stat-card">
              <div className="live-stat-icon" style={{ background: "#f59e0b20", color: "#f59e0b" }}>📅</div>
              <div className="live-stat-info">
                <span className="live-stat-value">{stats.todayAppointments}</span>
                <span className="live-stat-label">Today&apos;s Bookings</span>
              </div>
            </div>
            <div className="live-stat-card">
              <div className="live-stat-icon" style={{ background: "#8b5cf620", color: "#8b5cf6" }}>🟢</div>
              <div className="live-stat-info">
                <span className="live-stat-value">{stats.availableSlots}</span>
                <span className="live-stat-label">Open Slots</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Specialties Section */}
      <section className="specialties-section">
        <h2 className="section-title">Browse by Specialty</h2>
        <p className="section-subtitle">
          Find the right specialist for your healthcare needs
        </p>
        <div className="specialties-grid">
          {specialtyData.map((s, i) => (
            <Link
              to={`/providers`}
              key={s.name}
              className="specialty-card"
              style={{ animationDelay: `${i * 0.06}s`, "--accent": s.color }}
            >
              <span className="specialty-card-icon">{s.icon}</span>
              <span className="specialty-card-name">{s.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Book your appointment in 3 simple steps</p>
        <div className="how-it-works-grid">
          {howItWorks.map((item, i) => (
            <div className="hiw-card" key={i} style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="hiw-step-number">{item.step}</div>
              <div className="hiw-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose SmartAppoint</h2>
        <p className="section-subtitle">Everything you need for seamless appointment management</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      {topReviews.length > 0 && (
        <section className="testimonials-section">
          <h2 className="section-title">What Our Patients Say</h2>
          <p className="section-subtitle">Real feedback from real patients</p>
          <div className="testimonials-grid">
            {topReviews.map((review, i) => (
              <div className="testimonial-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="testimonial-stars">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>
                <p className="testimonial-comment">&ldquo;{review.comment}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {review.patient_name?.charAt(0) || "P"}
                  </div>
                  <div className="testimonial-info">
                    <strong>{review.patient_name}</strong>
                    <span>for {review.providerName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-glow"></div>
        <h2>Ready to Get Started?</h2>
        <p>Book your first appointment today and experience hassle-free scheduling.</p>
        <div className="cta-actions">
          <Link to="/book" className="btn btn-primary btn-lg">
            📅 Book Your Appointment
          </Link>
          <Link to="/providers" className="btn btn-outline btn-lg">
            Explore All Providers
          </Link>
        </div>
      </section>
    </div>
  );
}
