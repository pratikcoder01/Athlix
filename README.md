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

---

## 📊 What This Actually Measures

The Kata Analyzer feature uses **2D monocular pose estimation** (MediaPipe) and rule-based calculations to provide honest, transparent feedback. Here's exactly what it measures and what it does NOT measure:

### 🟢 What It Does Measure (Real, Calculated Metrics)
- **Joint Angles**: Elbow, knee, hip, and shoulder angles using vector dot product math
- **Center of Mass (COM)**: Weighted average of hip and shoulder landmark positions
- **Stability**: Frame-to-frame variance in COM position (lower variance = more stable)
- **Symmetry**: Comparison of left vs. right joint angles during stances
- **Guard Position**: How often hands stay above hip level when not performing techniques
- **Movement Velocity**: Frame-to-frame displacement of wrists/ankles divided by time
- **Stance Width**: Normalized distance between ankles (relative to shoulder width)

### 🟢 What It Actually Detects
- **Broad Stances**: Natural Stance, Front Stance, Horse Stance, Back Stance
- **Broad Techniques**: Arm Strike, Leg Strike, Block (no fine-grained technique classification)

### 🔴 What It Does NOT Measure
- **True 3D Position**: Uses approximate world coordinates from MediaPipe, not true 3D tracking
- **Physical Force / Power**: Cannot measure force without additional sensors
- **Impact / Contact**: Cannot detect if a strike makes contact with a target
- **Fine-Grained Technique Names**: Does not distinguish between Oi Zuki, Gyaku Zuki, etc.
- **Kata Recognition**: No attempt to guess or classify specific kata sequences
- **Weight Distribution**: Cannot accurately tell how much weight is on each foot

### Composite Score Formula
The overall score is a weighted sum of calculated metrics:
```
Overall Score = (Stability × 0.25) + (Guard × 0.15) + (Precision × 0.25) + (Symmetry × 0.20) + (Velocity × 0.15)
```

All scores are calculated directly from pose landmark data and are displayed with full transparency.
