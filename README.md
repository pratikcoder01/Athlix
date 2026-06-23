# ATHLIX 🥋
> Premium Next-Gen Sports-Tech Platform for Combat Sports Athletes, Coaches, Academies, and Tournament Organizers.

ATHLIX is a production-grade, startup-ready MERN platform connecting martial artists and combat sports enthusiasts in one unified workspace. The platform blends professional coaching bookings, real-time social feeds, geospatial academy discovery, and digital tournament bracket registries.

---

## 📁 Repository Architecture

```text
athlix/
├── .github/                       # Pull Request and Issue templates
├── client/                        # Next.js 15 + React 19 + TypeScript Frontend
├── server/                        # Express + TypeScript API Backend
├── docs/                          # Architecture design and deployment details
│   ├── db_design.md               # MongoDB collection structure and ERD
│   ├── api_map.md                 # Route endpoint map & Socket.io channels
│   └── setup_guide.md             # Local environment & production deployments
├── vercel.json                    # Root Vercel zero-config deploy schema
├── CONTRIBUTING.md                # Scoped branch workflows & commit style
└── package.json                   # Root monorepo workspace coordinator
```

---

## 🛠️ Tech Stack & Design System

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, GSAP, Three.js, React Three Fiber, Lenis Smooth Scroll, React Query (TanStack Query), React Hook Form, Zod, Zustand, Socket.io Client.
- **Backend**: Node.js, Express.js, TypeScript, MongoDB Atlas, Mongoose, JWT, bcrypt, Cloudinary, Multer, Socket.io.
- **Deployment**: Vercel (Frontend), Render (Backend), MongoDB Atlas.

### Theme Palette (Dark Premium)
- **Background**: `#0B1020` (Midnight Titanium Blue)
- **Cards**: `#12182B` (Combat Sleek Navy-Grey)
- **Primary Accent**: `#FF5A3D` (Fiery Crimson Orange - combat energy)
- **Secondary Accent**: `#FF8A3D` (Belt Orange - rank achievements)
- **Gold Accent**: `#F7B500` (Belt Gold - achievement badges)
- **Success Accent**: `#22C55E` (Emerald Green - approved states)
- **Typography**: `Bebas Neue` (Accent Headers), `Clash Display` (Sleek UI Headers), `Inter` (Body Text)

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

* **Frontend Client (Next.js)**: `http://localhost:3000`
* **Backend Server (Express)**: `http://localhost:5000`

For full configuration keys and cloud deployment setup guides, refer to the [Setup Guide](file:///docs/setup_guide.md).
For database design details, see [Database Design](file:///docs/db_design.md).
For API maps and Socket channels, see [API Route Map](file:///docs/api_map.md).
