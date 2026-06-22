import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('athlete');
  const [discipline, setDiscipline] = useState('BJJ');
  const [beltRank, setBeltRank] = useState('White');
  const [error, setError] = useState('');
  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !role || !discipline || !beltRank) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const result = await signup(name, email, password, role, discipline, beltRank);
    if (result.success) {
      navigate('/feed');
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  const disciplines = ['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA'];

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create DojoPro Account 🥋
          </h2>
          <p className="mt-2 text-center text-sm text-dojo-muted">
            Or{' '}
            <Link to="/login" className="font-semibold text-dojo-primary hover:underline">
              sign in to existing account
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-dojo-primary bg-opacity-10 border border-dojo-primary p-4 text-sm text-dojo-primary">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="name" className="text-xs font-semibold text-dojo-muted uppercase tracking-wider block mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-dojo-border bg-dojo-dark px-4 py-3 text-white placeholder-dojo-muted focus:border-dojo-primary focus:outline-none transition duration-200"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="text-xs font-semibold text-dojo-muted uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-dojo-border bg-dojo-dark px-4 py-3 text-white placeholder-dojo-muted focus:border-dojo-primary focus:outline-none transition duration-200"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-semibold text-dojo-muted uppercase tracking-wider block mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-dojo-border bg-dojo-dark px-4 py-3 text-white placeholder-dojo-muted focus:border-dojo-primary focus:outline-none transition duration-200"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="text-xs font-semibold text-dojo-muted uppercase tracking-wider block mb-2">
                  I am a...
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-md border border-dojo-border bg-dojo-dark px-4 py-3 text-white focus:border-dojo-primary focus:outline-none transition duration-200"
                >
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach / Sensei</option>
                </select>
              </div>

              <div>
                <label htmlFor="discipline" className="text-xs font-semibold text-dojo-muted uppercase tracking-wider block mb-2">
                  Discipline
                </label>
                <select
                  id="discipline"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className="w-full rounded-md border border-dojo-border bg-dojo-dark px-4 py-3 text-white focus:border-dojo-primary focus:outline-none transition duration-200"
                >
                  {disciplines.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="beltRank" className="text-xs font-semibold text-dojo-muted uppercase tracking-wider block mb-2">
                Current Belt Rank
              </label>
              <input
                id="beltRank"
                name="beltRank"
                type="text"
                required
                value={beltRank}
                onChange={(e) => setBeltRank(e.target.value)}
                className="w-full rounded-md border border-dojo-border bg-dojo-dark px-4 py-3 text-white placeholder-dojo-muted focus:border-dojo-primary focus:outline-none transition duration-200"
                placeholder="e.g. White, Blue, Purple, Black"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-dojo-primary py-3 px-4 text-sm font-semibold text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-dojo-primary focus:ring-offset-2 focus:ring-offset-dojo-dark transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-red"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
