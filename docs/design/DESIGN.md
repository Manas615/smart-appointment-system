# Software Design Document

## 1. Design Principles Applied

### Abstraction
- The **API module** (`frontend/src/api.js`) abstracts all HTTP communication behind clean function calls (e.g., `api.getProviders()`, `api.bookAppointment(data)`). Components never deal with fetch logic or URL construction.
- The **database module** (`backend/db.js`) abstracts SQLite connection management and schema creation. Route handlers use prepared statements without worrying about connection lifecycle.

### Modularity
- **Backend routes** are split into separate modules by domain: `providers.js`, `services.js`, `slots.js`, `appointments.js`. Each module is self-contained and independently maintainable.
- **Frontend pages** are separate components: `Home.jsx`, `Providers.jsx`, `Book.jsx`, `MyAppointments.jsx`. Each page manages its own state and API calls.
- **Middleware** (error handling, CORS, validation) is factored into reusable layers.

### High Cohesion
- Each route module handles only its related entity (e.g., `routes/appointments.js` handles booking, listing, and cancellation of appointments only).
- Each React page component groups related UI, state, and effects for a single user flow.

### Low Coupling
- Frontend components communicate with the backend only through the `api.js` abstraction layer — changing API URLs requires editing only one file.
- Backend route modules depend only on the shared `db` module, not on each other. Adding a new entity (e.g., "reviews") requires creating a new route file and registering it in `index.js`, with zero changes to existing routes.
- The error-handler middleware is decoupled from routes; routes simply call `next(err)`.

---

## 2. High-Level Architecture

### Architecture Style: **Layered (Client-Server with 3-Tier Separation)**

We chose a layered architecture for clear separation of concerns:

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Presentation** | React 19 + Tailwind CSS + Vite | User interface, routing, state management |
| **Business Logic** | Express.js + express-validator | REST API endpoints, request validation, transactional booking logic |
| **Data** | SQLite (better-sqlite3) | Persistent storage with 4 normalized tables |

**Why this style?**
- **Simplicity** — A 3-tier layered architecture is straightforward for an appointment system with CRUD operations.
- **Testability** — Each layer can be tested independently (API endpoints via curl, frontend via browser).
- **Scalability path** — The data layer can be swapped from SQLite to PostgreSQL without changing the API layer; the frontend can be replaced without touching the backend.

### Architecture Diagram

> See `docs/design/architecture.drawio` for the editable Draw.io source.

```
┌─────────────────────────────────────────────────┐
│           PRESENTATION LAYER (Client)           │
│  React 19 │ React Router │ Tailwind │ Vite      │
│  Pages: Home, Providers, Book, MyAppointments   │
│  Components: Navbar                             │
│  Utilities: api.js (fetch wrapper)              │
└─────────────────┬───────────────────────────────┘
                  │  HTTP / JSON (REST)
┌─────────────────▼───────────────────────────────┐
│          BUSINESS LOGIC LAYER (Server)          │
│  Express.js │ CORS │ express-validator          │
│  Routes: /providers /services /slots /appts     │
│  Middleware: errorHandler                       │
└─────────────────┬───────────────────────────────┘
                  │  SQL Queries
┌─────────────────▼───────────────────────────────┐
│              DATA LAYER (Database)              │
│  SQLite (better-sqlite3)                        │
│  Tables: providers, services, time_slots,       │
│          appointments                           │
└─────────────────────────────────────────────────┘
```

---

## 3. User Interface Design

### Pages

1. **Home Page** — Hero section with gradient background, animated floating shapes, feature cards, and call-to-action buttons.
2. **Providers Page** — Card grid with color-coded specialties, emoji avatars, provider bio, contact info, and direct "Book" button.
3. **Booking Page** — Multi-step wizard with stepper UI: Select Provider → Select Service → Pick Date & Time → Enter Details → Confirmation.
4. **My Appointments Page** — Email-based lookup form, appointment cards with status badges (confirmed/cancelled), and cancel button.

### UI/UX Design Decisions

- **Consistent Button Styles**: Primary (indigo), outline, and danger variants used consistently across all pages.
- **Clear Feedback**: Loading spinners, error messages, empty states, and success confirmations provide visual feedback at every interaction.
- **Step-by-Step Booking**: The stepper component shows progress and allows backward navigation, reducing cognitive load.
- **Mobile-Responsive**: Navbar collapses to hamburger menu; grids adapt from multi-column to single column on small screens.
- **Color-Coded Specialties**: Each medical specialty has a unique color, making it easy to distinguish providers at a glance.

---

## 4. Design Decisions & Why

| # | Decision | Why |
|---|----------|-----|
| 1 | **Separated route modules by domain** (`providers.js`, `slots.js`, `appointments.js`) | Keeps low coupling — each module handles one entity; adding new features doesn't require modifying existing routes. |
| 2 | **Centralized API abstraction** (`api.js`) on the frontend | All backend communication goes through one file. Changing API base URL, adding auth headers, or modifying error handling requires changes in only one place. |
| 3 | **Transactional booking logic** (SQLite transactions for booking/cancellation) | Prevents race conditions where two users could book the same slot. Slot availability and appointment creation are atomic. |
| 4 | **Centralized error-handler middleware** (`errorHandler.js`) | Routes only throw or call `next(err)` — they don't format error responses. This ensures consistent JSON error structure across all endpoints. |
| 5 | **SQLite with better-sqlite3** (synchronous driver) | Zero configuration, no external database server needed. Synchronous API simplifies code (no async/await needed for DB calls). Sufficient for a single-server academic project. |

---

## 5. Database Schema (ER Diagram)

```
providers ──────< services
    │
    ├──────< time_slots
    │              │
    │              └──────< appointments
    │                          │
    └──────────────────────────┘
```

- **providers** (1) → (N) **services**: A provider offers multiple services.
- **providers** (1) → (N) **time_slots**: A provider has multiple time slots.
- **time_slots** (1) → (1) **appointments**: Each slot can have at most one appointment (enforced by UNIQUE constraint).
- **appointments** references **providers** and **services** for denormalized querying.

---

## 6. Project Structure

```
smart-appointment-system/
├── backend/
│   ├── index.js              # Express server entry point
│   ├── db.js                 # SQLite database setup & schema
│   ├── seed.js               # Sample data seeder
│   ├── package.json
│   ├── Dockerfile
│   ├── middleware/
│   │   └── errorHandler.js   # Centralized error handling
│   └── routes/
│       ├── providers.js      # Provider CRUD endpoints
│       ├── services.js       # Service CRUD endpoints
│       ├── slots.js          # Time slot management
│       └── appointments.js   # Booking & cancellation
├── frontend/
│   ├── index.html
│   ├── vite.config.js        # Vite + API proxy config
│   ├── tailwind.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── src/
│       ├── main.jsx          # React entry point
│       ├── App.jsx           # Router + layout
│       ├── App.css           # Component styles
│       ├── index.css         # Design system (CSS vars + Tailwind)
│       ├── api.js            # Backend API abstraction
│       ├── components/
│       │   └── Navbar.jsx    # Navigation bar
│       └── pages/
│           ├── Home.jsx      # Landing page
│           ├── Providers.jsx # Provider listing
│           ├── Book.jsx      # Booking wizard
│           └── MyAppointments.jsx
├── docs/design/              # Design documentation
├── docker-compose.yml        # Container orchestration
└── .github/workflows/ci.yml  # CI pipeline
```
