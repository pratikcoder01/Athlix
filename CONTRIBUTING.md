# Contributing to ATHLIX 🥋

Welcome to the **ATHLIX** engineering team! As a startup CTO and Senior Staff, we want to maintain the highest standard of engineering rigor. Follow this guide to ensure your contributions align with our architectural policies.

---

## 🌳 Git Branch Strategy

We operate on a two-parent branch strategy (`main` and `develop`) with scoped feature branches:

1. **`main`**: Production-ready code only. Staging/Production deployments auto-build from here.
2. **`develop`**: Integration branch for features. All pull requests are merged here first.
3. **`feature/<name>`**: Scoped branches for specific features:
   - `feature/auth` - Login, Signup, Role-Based Access Control, JWT setup
   - `feature/profile` - Athlete & Coach Profile creation & management
   - `feature/feed` - Community feed, Cloudinary uploads, likes, comments
   - `feature/tournaments` - Tournament registry, bracket management
   - `feature/bookings` - Coaching calendars, schedules, request handling
4. **`hotfix/<name>`**: Quick patches direct to production.

---

## 🛠️ Step-by-Step Workflow

1. **Clone & Setup**:
   ```bash
   git clone https://github.com/pratikcoder01/Athlix.git
   cd Athlix
   npm run install-all
   ```
2. **Create a Feature Branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
3. **Write Code**:
   - Ensure you are using **TypeScript** for both client and server files.
   - Run tests and linting check locally.
4. **Commit Changes**:
   Follow semantic commit messages:
   - `feat(auth): add google OAuth support`
   - `fix(booking): resolve time overlap checks`
   - `docs(api): update tournament routes reference`
   - `chore: update dependencies`
5. **Open a Pull Request**:
   - Push your branch to GitHub.
   - Open a PR from `feature/your-feature-name` into `develop`.
   - Fill out the PR template completely.
   - Await review from Pratik (Project Lead) or another staff engineer.

---

## 🔒 Code Standards & Security

- **Strict Types**: Set `"strict": true` in TypeScript configs. Do not use `any` unless absolutely necessary (and commented with rationale).
- **Zod Schema Validation**: Validate every incoming API body, query parameter, and environment variable using Zod.
- **Errors**: Handle errors asynchronously using async handler wrappers, and bubble them to the centralized express error handling middleware.
- **Performance**: Use react-query (`@tanstack/react-query`) for caching client states. Use database indexes for fast query resolution.
