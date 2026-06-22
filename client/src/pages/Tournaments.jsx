import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader, Calendar, MapPin, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';

const Tournaments = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for Create Tournament
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [discipline, setDiscipline] = useState('BJJ');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [entryFee, setEntryFee] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await api.get('/tournaments');
      if (response.data.success) {
        setTournaments(response.data.tournaments);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (tournamentId) => {
    setRegLoading((prev) => ({ ...prev, [tournamentId]: true }));
    try {
      const response = await api.post(`/tournaments/${tournamentId}/register`);
      if (response.data.success) {
        setTournaments(
          tournaments.map((t) => (t._id === tournamentId ? response.data.tournament : t))
        );
      }
    } catch (error) {
      console.error('Error registering for tournament:', error);
    } finally {
      setRegLoading((prev) => ({ ...prev, [tournamentId]: false }));
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setErrorMsg('');

    try {
      const response = await api.post('/tournaments', {
        title,
        description,
        date,
        location,
        discipline,
        registrationDeadline,
        entryFee: Number(entryFee),
      });

      if (response.data.success) {
        setTournaments([response.data.tournament, ...tournaments]);
        setShowCreateModal(false);
        // Reset states
        setTitle('');
        setDescription('');
        setDate('');
        setLocation('');
        setDiscipline('BJJ');
        setRegistrationDeadline('');
        setEntryFee(0);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to create tournament');
    } finally {
      setCreateLoading(false);
    }
  };

  const disciplines = ['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA'];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-dojo-muted">
        <Loader className="animate-spin mr-2" />
        <span>Loading tournaments...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Championship Tournament Portal</h2>
          <p className="mt-1 text-dojo-muted">Register for upcoming events, test your skills, and rank up.</p>
        </div>

        {/* Create Tournament Button - Only for Coaches */}
        {user.role === 'coach' && (
          <button
            onClick={() => {
              setShowCreateModal(true);
              setErrorMsg('');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-dojo-primary hover:bg-opacity-90 text-white rounded text-sm font-semibold transition"
          >
            <Plus size={16} />
            <span>Create Tournament</span>
          </button>
        )}
      </div>

      {/* Tournament Cards Grid */}
      {tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((tournament) => {
            const isRegistered = tournament.registeredAthletes?.some(
              (ath) => (ath._id || ath) === user.id
            );
            const deadlinePassed = new Date() > new Date(tournament.registrationDeadline);

            return (
              <div
                key={tournament._id}
                className="glass-panel rounded-xl p-6 flex flex-col justify-between hover:border-opacity-60 transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold tracking-widest bg-dojo-primary bg-opacity-10 border border-dojo-primary border-opacity-35 text-dojo-primary px-3 py-1 rounded-full uppercase">
                      {tournament.discipline}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {tournament.entryFee === 0 ? 'FREE' : `$${tournament.entryFee}`}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{tournament.title}</h3>
                  <p className="text-sm text-dojo-text leading-relaxed line-clamp-3 mb-4">
                    {tournament.description}
                  </p>

                  <div className="space-y-2 text-xs text-dojo-muted mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-dojo-primary" />
                      <span>Event Date: {new Date(tournament.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-dojo-primary" />
                      <span>Location: {tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-dojo-muted">
                      <ShieldAlert size={14} />
                      <span>
                        Deadline: {new Date(tournament.registrationDeadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Athlete controls */}
                {user.role === 'athlete' ? (
                  isRegistered ? (
                    <div className="w-full py-2 bg-emerald-500 bg-opacity-10 text-emerald-400 border border-emerald-500 border-opacity-30 rounded text-sm font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={16} />
                      <span>You are Registered</span>
                    </div>
                  ) : deadlinePassed ? (
                    <div className="w-full py-2 bg-dojo-border rounded text-sm text-dojo-muted font-semibold text-center">
                      Registration Closed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(tournament._id)}
                      disabled={regLoading[tournament._id]}
                      className="w-full py-2 bg-dojo-primary hover:bg-opacity-95 text-white rounded text-sm font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      {regLoading[tournament._id] ? <Loader className="animate-spin" size={16} /> : null}
                      <span>Register for Event</span>
                    </button>
                  )
                ) : (
                  <div className="text-xs text-dojo-muted border border-dojo-border rounded p-2 bg-dojo-dark bg-opacity-30">
                    <span className="font-semibold text-white">Registered Athletes ({tournament.registeredAthletes?.length || 0}):</span>
                    <p className="mt-1 font-mono truncate">
                      {tournament.registeredAthletes?.map((ath) => ath.name).join(', ') || 'No registrations yet.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-dojo-border rounded-lg text-dojo-muted">
          No championship matches published yet. Try checks later!
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 px-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-dojo-muted hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-white mb-4">Create New Championship Event</h3>

            {errorMsg && (
              <div className="mb-4 rounded bg-dojo-primary bg-opacity-10 border border-dojo-primary p-3 text-xs text-dojo-primary">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Tournament Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Submission Open"
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                />
              </div>

              <div>
                <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Event Description</label>
                <textarea
                  required
                  placeholder="Details, levels, rules, and weighting..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Discipline</label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                  >
                    {disciplines.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Entry Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                  />
                </div>

                <div>
                  <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Reg. Deadline</label>
                  <input
                    type="date"
                    required
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Location Venue</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madison Square Garden, New York"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-dojo-border text-sm text-dojo-muted rounded hover:bg-dojo-dark transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-dojo-primary text-sm text-white rounded hover:bg-opacity-90 flex items-center gap-1.5 transition disabled:opacity-50 font-semibold"
                >
                  {createLoading ? <Loader className="animate-spin" size={16} /> : null}
                  <span>Publish Tournament</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tournaments;
