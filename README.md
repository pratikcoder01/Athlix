# ATHLIX 🥋
> A development project for combat-sports clubs, local events, and experimental 2D kata feedback.

ATHLIX combines a Next.js client, Express/MongoDB API, authenticated realtime channels, and a Python pose-analysis service. It is **not yet production-ready**. Some screens contain sample content, several workflows remain incomplete, and configured infrastructure is required to exercise real account and event flows. Paid checkout, subscriptions, and settlement reporting are not implemented.

The proposed first pilot is karate academies and local tournament organizers; demand and geography remain hypotheses. Review the [product audit](docs/PRODUCT_AUDIT.md), [roadmap](docs/ROADMAP.md), and [investor-readiness disclosure](docs/pitch/INVESTOR_READINESS.md) before presenting the build. No user counts, customer reviews, partnerships, security certifications, revenue, or independently measured model accuracy are claimed.

Current implementation and evidence: [feature status](docs/FEATURE_STATUS.md),
[verification record](docs/VERIFICATION.md), [setup](docs/setup_guide.md), and
[operations/rollback](docs/OPERATIONS.md). Local test passes are distinguished
from disposable-service CI and unverified live-host/provider acceptance.
The [architecture overview](docs/ARCHITECTURE.md) explains the trust boundaries.

---

## 📁 Repository Architecture

```text
athlix/
├── .github/                       # CI, Pull Request and Issue templates
├── client/                        # Next.js 15 + React 19 + TypeScript Frontend
├── server/                        # Express + TypeScript API Backend
├── cv-service/                    # Internal FastAPI pose-analysis worker
├── docs/                          # Architecture design and deployment details
│   ├── db_design.md               # MongoDB collection structure and ERD
│   ├── api_map.md                 # Route endpoint map & Socket.io channels
│   └── setup_guide.md             # Local environment & production deployments
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
- **Typography**: self-hosted `Space Grotesk` (headings), `Sora` (numbers), `Inter` (body) and `JetBrains Mono` (mono)

---

## 👥 Startup Team Assignments

* **ANUJA (UI/UX Designer)**: Figma designs, typography tokens integration, and micro-animations layouts.
* **KIRAT (Frontend Developer)**: TypeScript components, React Hook forms, protected gates, and client query caching.
* **SHRAVAN (Backend Developer)**: Mongoose schemas, token controllers, rate limiting, and Socket.io channel setup.
* **PRATIK (Project Lead & Full Stack)**: Monorepo integration, Cloudinary, DevOps workflows, testing, and pitch preparation.

---

## ⚙️ Initial Setup & Commands

First configure the frontend backend origin, `NEXT_PUBLIC_API_URL` and optional
server-only `AUTH_API_ORIGIN` override, using the [Setup Guide](docs/setup_guide.md). To install all
dependencies across the entire monorepo:
```bash
npm run install-all
```

To run both backend and frontend concurrently in development mode:
```bash
npm run dev
```

* **Frontend Client (Next.js)**: `http://localhost:3000`
* **Backend Server (Express)**: `http://localhost:5000`

For configuration and deployment preparation, refer to the [Setup Guide](docs/setup_guide.md).
For database design details, see [Database Design](docs/db_design.md).
For API maps and Socket channels, see [API Route Map](docs/api_map.md).

---

## 📊 What This Actually Measures

The Kata Analyzer feature uses **2D monocular pose estimation** (MediaPipe) and rule-based calculations to provide honest, transparent feedback. Here's exactly what it measures and what it does NOT measure:

### 🟢 What It Does Measure (Real, Calculated Metrics)
- **Joint Angles**: Elbow, knee, hip, and shoulder angles using vector dot product math
- **Body-Center Proxy**: Weighted average of hip and shoulder landmark positions; not a measured physical center of mass
- **Stability Heuristic**: Lateral displacement of that body-center proxy from the ankle midpoint
- **Symmetry**: Comparison of left vs. right joint angles during stances
- **Guard Position**: How often hands stay above hip level when not performing techniques
- **Movement Velocity**: Frame-to-frame displacement of wrists/ankles divided by time
- **Stance Width**: Normalized distance between ankles (relative to shoulder width)

### 🟢 Heuristic Labels
- **Broad Stance Rules**: Natural Stance, Front Stance, Horse Stance, Back Stance
- **Broad Movement Rules**: Arm Strike, Leg Strike, Block

These labels come from angle/distance/speed thresholds. Their recognition
accuracy has not been measured against a permissioned combat-sports dataset.

### 🔴 What It Does NOT Measure
- **True 3D Position**: Uses approximate world coordinates from MediaPipe, not true 3D tracking
- **Physical Force / Power**: Cannot measure force without additional sensors
- **Impact / Contact**: Cannot detect if a strike makes contact with a target
- **Fine-Grained Technique Names**: Does not distinguish between Oi Zuki, Gyaku Zuki, etc.
- **Kata Recognition**: No attempt to guess or classify specific kata sequences
- **Weight Distribution**: Cannot accurately tell how much weight is on each foot

### Composite Score Formula
The overall score normalizes the configured weights over observed components:
```
Overall Score = sum(observed score × configured weight) / sum(observed weights)
Configured weights: stability .25, guard .15, precision .25, symmetry .20, velocity .15
```

Unobserved guard/precision components are null and excluded, rather than assigned
a plausible default. Scores are pose-derived heuristics, not official judging,
physical force, medical advice or validated coaching outcomes. See the
[evaluation protocol](docs/AI_EVALUATION.md) and [actual verification](docs/VERIFICATION.md).
