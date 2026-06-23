# ATHLIX - Setup, Environment & Deployment Guide

This guide walks through running the **ATHLIX** monorepo locally and deploying it to production hosts (Vercel, Render, and MongoDB Atlas).

---

## ⚙️ Local Development Setup

### Prerequisites
- **Node.js** v18+ or v20+
- **MongoDB** local service or MongoDB Atlas cluster connection string

### Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/pratikcoder01/Athlix.git
   cd Athlix
   ```
2. **Install All Monorepo Dependencies**:
   ```bash
   npm run install-all
   ```
3. **Configure Environment Files**:
   Create `.env` inside `/server` and `/client`. See the Environment Variables section below.
4. **Launch Dev Servers**:
   ```bash
   npm run dev
   ```
   - Frontend client runs on: `http://localhost:5173`
   - Backend API runs on: `http://localhost:5000`

---

## 🔑 Environment Variables Configuration

### Backend Server (`server/.env`)
Create a file named `.env` in the `/server` directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/athlix?retryWrites=true&w=majority

# Security Configuration
JWT_SECRET=super_secret_jwt_key_for_athlix_authentication

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=athlix-cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefg-hijklmnop-qrstuv
```

### Frontend Client (`client/.env`)
Create a file named `.env` in the `/client` directory:
```env
# Api Gateway
VITE_API_URL=http://localhost:5000
```

---

## 🚀 Production Deployment Guide

### 1. Database: MongoDB Atlas
1. Sign up on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Deploy a free Shared Cluster.
3. In **Database Access**, create a user with read/write credentials.
4. In **Network Access**, whitelist connection requests (allow `0.0.0.0/0` for Render server integration).
5. Obtain the MongoDB connection URI string under the **Connect** options.

### 2. Backend Server: Render
1. Sign up on [Render](https://render.com).
2. Create a new **Web Service** and link it to your GitHub Repository.
3. Configure the following build details:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build` (runs tsc compile)
   - **Start Command**: `npm run start` (runs Node on dist compile)
4. Add all Backend environment variables (`MONGO_URI`, `JWT_SECRET`, etc.) to Render's **Environment** tab.

### 3. Frontend Client: Vercel
1. Sign up on [Vercel](https://vercel.com).
2. Import a new Project from your GitHub Repository.
3. Configure the following build details:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (runs tsc and vite build)
   - **Output Directory**: `dist`
4. Add the frontend environment variable:
   - `VITE_API_URL` set to the live URL of your deployed Render Web Service.
