# ATHLIX 🥋
> Premium Sports-Tech Platform for Combat Sports Athletes, Coaches, Academies, and Tournament Organizers.

ATHLIX is a production-grade, startup-ready MERN platform connecting martial artists and combat sports enthusiasts in one unified workspace. The platform blends professional coaching bookings, real-time social feeds, geospatial academy discovery, and digital tournament bracket registries.

---

## 📁 Repository Architecture

```text
athlix/
├── .github/                       # Pull Request and Issue templates
├── client/                        # Vite + React 19 + TypeScript Frontend
│   ├── src/
│   │   ├── components/            # UI layout elements and protected gates
│   │   ├── context/               # AuthContext & real-time SocketContext
│   │   ├── pages/                 # Public, Protected, and Admin view panels
│   │   ├── routes/                # Client-side router mapping (AppRoutes)
│   │   └── main.tsx               # Mounting root
│   ├── tsconfig.json              # Client compilation config
│   └── tailwind.config.js         # Custom theme configuration (#0D0D1A, etc.)
│
├── server/                        # Express + TypeScript API Backend
│   ├── src/
│   │   ├── config/                # Mongoose DB connections & Cloudinary settings
│   │   ├── controllers/           # Endpoint handlers (Auth, Profile, Bookings, etc.)
│   │   ├── middleware/            # JWT validation, error formatting, rate limiters
│   │   ├── models/                # TypeScript Mongoose indexed models
│   │   ├── routes/                # Express routing layers
│   │   └── index.ts               # HTTP & Socket.io server listener
│   └── tsconfig.json              # Server compilation config
│
├── docs/                          # Architecture design and deployment details
│   ├── db_design.md               # MongoDB collection structure and ERD
│   ├── api_map.md                 # Route endpoint map & Socket.io channels
│   └── setup_guide.md             # Local environment & production deployments
│
├── CONTRIBUTING.md                # Scoped branch workflows & commit style
└── package.json                   # Root monorepo workspace coordinator
```

---

## 🛠️ Tech Stack & Design System

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router DOM, React Query (TanStack Query), React Hook Form, Zod, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express.js, TypeScript, MongoDB Atlas, Mongoose, JWT, bcrypt, Cloudinary, Multer, Socket.io
- **Deployment**: Vercel (Frontend), Render (Backend)

### Theme Palette (Dark Premium)
- **Background**: `#0D0D1A` (Midnight Titanium Blue)
- **Cards**: `#1A1A2E` (Combat Sleek Navy-Grey)
- **Primary Accent**: `#E74C3C` (Fiery Crimson Red - combat energy)
- **Secondary Accent**: `#F39C12` (Belt Gold - rank achievements)
- **Success Accent**: `#27AE60` (Emerald Green - approved states)
- **Typography**: `Bebas Neue` (Headers), `Inter` (Body)

---

## 👥 Startup Team Assignments

* **ANUJA (UI/UX Designer)**: Figma designs, typography tokens integration, and micro-animations layouts.
* **KIRAT (Frontend Developer)**: TypeScript components, React Hook forms, protected gates, and client query caching.
* **SHRAVAN (Backend Developer)**: Mongoose schemas, token controllers, rate limiting, and Socket.io channel setup.
* **PRATIK (Project Lead & Full Stack)**: Monorepo integration, Cloudinary, DevOps workflows, testing, and pitch preparation.

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

For full configuration keys and cloud deployment setup guides, refer to the [Setup Guide](file:///docs/setup_guide.md).
For database design details, see [Database Design](file:///docs/db_design.md).
For API maps and Socket channels, see [API Route Map](file:///docs/api_map.md).
