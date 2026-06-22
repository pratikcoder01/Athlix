# DojoPro 🥋
> A startup-level professional networking, coaching, tournament, and athlete management platform for martial artists.

DojoPro combines the networking properties of **LinkedIn**, the athletic progression tracking of **Strava**, and the media sharing engagement of **Instagram** into a single premium dark sports-tech application.

---

## 📁 Repository Directory
```text
dojo-pro/ (workspace root)
├── package.json                   # Root workspace and script orchestrator
├── README.md                      # General platform docs, team guides
├── .gitignore                     # Monorepo files filter
├── .env.example                   # Shared template environment keys
├── /docs                          # Design notes and system documentations
│
├── /server                        # Node.js + Express API Backend
│   ├── package.json
│   ├── index.js                   # Node.js server entrypoint
│   ├── app.js                     # Express app setup with security headers
│   ├── /config                    # DB & cloud configurations
│   ├── /models                    # Mongoose database models
│   ├── /controllers               # Endpoint business logic handlers
│   ├── /middleware                # Auth verification, rate limiting, and errors
│   ├── /routes                    # Express API routes mapping
│   └── /utils                     # Zod request validators
│
└── /client                        # Vite + React 19 Frontend
    ├── package.json
    ├── tailwind.config.js         # Custom theme colors (e.g. background #0d0d1a)
    ├── postcss.config.js
    ├── index.html
    └── /src
        ├── main.jsx               # Entry component mount
        ├── App.jsx                # Global router and state layers
        ├── index.css              # Custom font weights and styles
        ├── /context               # Authentication session provider
        ├── /services              # Axios instances with Bearer interceptors
        ├── /hooks                 # TanStack Query custom data fetchers
        ├── /routes                # Routing gates (ProtectedRoute mappings)
        ├── /components            # Reusable buttons, inputs, layouts
        └── /pages                 # Screen files (Landing, Dashboards, Discovery, Feed, Gyms, Settings)
```

---

## 🛠️ Premium Sports-Tech UI Design System
* **Theme**: Dark mode by default
* **Background**: `#0d0d1a` (Deep titanium midnight blue)
* **Card BG**: `#1a1a2e` (Sleek deep navy-grey)
* **Primary Accent**: `#e74c3c` (Alizarin Red - combat energy)
* **Secondary Accent**: `#f39c12` (Orange-gold - rank belt achievements)
* **Success Accent**: `#27ae60` (Emerald green - approved statuses)
* **Typography**:
  - Headers: `Bebas Neue`
  - Body: `Inter`

---

## ⚙️ Initial Setup & Commands

To install all dependencies across the entire monorepo:
```bash
npm run install-all
```

To run both backend and frontend concurrently in development mode:
```bash
npm run dev
```

* **Frontend Client (Vite)**: `http://localhost:5173`
* **Backend Server (Express)**: `http://localhost:5000`

---

## 👥 Hackathon Team Assignments

* **Anuja** → UI/UX Designer (Mockups, Figma designs, Style tokens integration)
* **Kirat** → Frontend Developer (React components, Hook forms, Responsive grids)
* **Shravan** → Backend Developer (APIs, Database schemas, Mongoose, Auth)
* **Pratik** → Project Lead + Full Stack Integration (Cloudinary integrations, DevOps setup, Testing, Deployments)

---

## 🔒 API Endpoint Specification

### Auth Module
* `POST /api/auth/register` - Create account (Athlete, Coach, Admin role)
* `POST /api/auth/login` - Verify credentials and retrieve JWT

### User Profiles
* `GET /api/users` - Search profile list
* `GET /api/users/:id` - Fetch detailed athlete/coach profile card
* `PUT /api/users/:id` - Update location, bio, achievements, and social link integrations

### Community Feed
* `GET /api/posts` - Fetch posts feed
* `POST /api/posts` - Publish caption and Cloudinary file attachment
* `POST /api/posts/:id/like` - Toggle user like on posts

### Coach Booking
* `POST /api/bookings` - Submit private training appointment (Athlete role)
* `GET /api/bookings` - List dashboard training session appointments

### Tournament Portal
* `GET /api/tournaments` - List events
* `POST /api/tournaments` - Register events (Coach / Admin role only)

### Gym Directories
* `GET /api/gyms` - Search and discipline-filter nearby gyms

---

## 🚀 DevOps & Security Standard
* **Security Headers**: Managed by `helmet` to restrict unauthorized scripts.
* **Rate Limiting**: Enforced via `express-rate-limit` (Max 100 requests per 15 minutes per IP).
* **Data Verification**: Both backend and frontend validate payload shapes using `zod` schemas.
