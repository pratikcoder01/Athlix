import React, { useState } from 'react';
import { useCoaches } from '../hooks/useQueries';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Swords, Calendar, Loader, BookOpen } from 'lucide-react';

const Discovery = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [discipline, setDiscipline] = useState('');
  
  // Use TanStack query hook
  const { data: coaches, isLoading } = useCoaches(search, discipline);
  
  // Booking modal
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [timeslot, setTimeslot] = useState('');
  const [details, setDetails] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoach || !bookingDate || !timeslot) return;

    setBookingLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/bookings', {
        coachId: selectedCoach._id,
        date: bookingDate,
        slot: timeslot,
      });

      if (response.data.success) {
        setSuccessMsg(`Session booked successfully with ${selectedCoach.name}!`);
        setBookingDate('');
        setTimeslot('');
        setDetails('');
        setTimeout(() => setSelectedCoach(null), 2000);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to submit booking session');
    } finally {
      setBookingLoading(false);
    }
  };

  const disciplines = ['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Sensei Discovery</h2>
          <p className="mt-1 text-dojo-muted">Find and book 1-on-1 private training sessions with top-tier coaches.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-dojo-muted" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded bg-dojo-card border border-dojo-border pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
            />
          </div>

          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="rounded bg-dojo-card border border-dojo-border px-4 py-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
          >
            <option value="">All Disciplines</option>
            {disciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 rounded bg-emerald-500 bg-opacity-10 border border-emerald-500 p-4 text-sm text-emerald-400">
          {successMsg}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-dojo-muted">
          <Loader className="animate-spin mr-2" />
          <span>Searching for senseis...</span>
        </div>
      ) : coaches && coaches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach) => (
            <div key={coach._id} className="glass-panel rounded-xl p-6 flex flex-col justify-between hover:border-dojo-primary transition duration-300">
              <div>
                <div className="flex gap-4 mb-4">
                  {coach.profileImage ? (
                    <img
                      src={coach.profileImage}
                      alt={coach.name}
                      className="h-16 w-16 rounded-full object-cover border border-dojo-border"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dojo-border border border-dojo-border text-2xl font-bold text-dojo-primary uppercase">
                      {coach.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">{coach.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="text-[10px] font-bold bg-dojo-primary bg-opacity-10 text-dojo-primary px-2 py-0.5 rounded-full border border-dojo-primary border-opacity-20 flex items-center gap-0.5 uppercase">
                        <Swords size={9} />
                        <span>{coach.discipline}</span>
                      </span>
                      <span className="text-[10px] font-bold bg-dojo-secondary bg-opacity-10 text-dojo-secondary px-2 py-0.5 rounded-full border border-dojo-secondary border-opacity-20 flex items-center gap-0.5 uppercase">
                        <BookOpen size={9} />
                        <span>{coach.beltRank}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-dojo-text leading-relaxed line-clamp-3 mb-6">
                  {coach.bio || 'This coach has not added their bio description yet.'}
                </p>
              </div>

              {user.role === 'athlete' ? (
                <button
                  onClick={() => {
                    setSelectedCoach(coach);
                    setSuccessMsg('');
                    setErrorMsg('');
                  }}
                  className="w-full py-2 bg-dojo-primary hover:bg-opacity-90 text-white rounded text-sm font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Calendar size={14} />
                  <span>Book Session</span>
                </button>
              ) : (
                <div className="text-center py-2 bg-dojo-border rounded text-xs text-dojo-muted font-medium">
                  Viewing in Coach mode
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-dojo-border rounded-lg text-dojo-muted">
          No coaches found matching search filters.
        </div>
      )}

      {/* Booking Modal */}
      {selectedCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 px-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-xl relative">
            <button
              onClick={() => setSelectedCoach(null)}
              className="absolute top-4 right-4 text-dojo-muted hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-white mb-2 font-bebas uppercase tracking-wider">Book Private Session</h3>
            <p className="text-sm text-dojo-muted mb-4">
              Schedule 1-on-1 private lesson with <strong className="text-white">{selectedCoach.name}</strong>.
            </p>

            {errorMsg && (
              <div className="mb-4 rounded bg-dojo-primary bg-opacity-10 border border-dojo-primary p-3 text-xs text-dojo-primary">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Session Date</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                />
              </div>

              <div>
                <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Preferred Time slot</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10:00 AM - 11:30 AM"
                  value={timeslot}
                  onChange={(e) => setTimeslot(e.target.value)}
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                />
              </div>

              <div>
                <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Brief Details</label>
                <textarea
                  placeholder="Mention what specific technique you want to focus on (e.g. sweeps, guard pass)..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCoach(null)}
                  className="px-4 py-2 border border-dojo-border text-sm text-dojo-muted rounded hover:bg-dojo-dark transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-5 py-2 bg-dojo-primary text-sm text-white rounded hover:bg-opacity-90 flex items-center gap-1.5 transition disabled:opacity-50 font-semibold"
                >
                  {bookingLoading ? <Loader className="animate-spin" size={16} /> : null}
                  <span>Request Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discovery;
