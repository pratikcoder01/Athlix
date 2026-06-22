import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useBookings, useTournaments, useGyms } from '../hooks/useQueries';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Shield, Swords, PlusCircle, MessageSquare, Award, MapPin, Users, Trophy } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const { data: tournaments } = useTournaments();
  const { data: gyms } = useGyms();

  if (!user) return null;

  // Filter lists based on roles
  const athleteBookings = bookings?.filter((b) => (b.athleteId?._id || b.athleteId) === user.id) || [];
  const coachBookings = bookings?.filter((b) => (b.coachId?._id || b.coachId) === user.id) || [];
  const pendingRequests = coachBookings.filter((b) => b.status === 'pending');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  // --------------------------------------------------
  // ATHLETE DASHBOARD VIEW
  // --------------------------------------------------
  const AthleteDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-bebas text-white tracking-wide">ATHLETE DASHBOARD</h1>
          <p className="text-dojo-muted mt-1">Welcome back, {user.name}. Track your training hours and manage your profile.</p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/discovery"
            className="px-5 py-2.5 bg-dojo-primary hover:bg-opacity-90 text-white rounded text-xs font-bold uppercase tracking-wider transition shadow-glow-red"
          >
            Find Coach
          </Link>
          <Link
            to="/feed"
            className="px-5 py-2.5 border border-dojo-border bg-dojo-card text-white rounded text-xs font-bold uppercase tracking-wider hover:border-dojo-primary transition"
          >
            Post Update
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Belt Progression Card */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-dojo-secondary text-white text-[10px] font-bold px-3 py-1 rounded-bl uppercase">
            Active Rank
          </div>
          <h3 className="text-sm font-bold uppercase text-dojo-muted tracking-wider mb-4">Progression Belt</h3>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-dojo-secondary bg-opacity-10 border border-dojo-secondary flex items-center justify-center text-dojo-secondary">
              <Award size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white uppercase">{user.beltRank}</h4>
              <p className="text-xs text-dojo-muted mt-1">Discipline: {user.discipline}</p>
            </div>
          </div>
        </motion.div>

        {/* Mat Rounds Count */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase text-dojo-muted tracking-wider mb-4">Training Achievements</h3>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-dojo-primary bg-opacity-10 border border-dojo-primary flex items-center justify-center text-dojo-primary">
              <Trophy size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">{user.achievements?.length || 0} Badges</h4>
              <p className="text-xs text-dojo-muted mt-1">Logged on profile</p>
            </div>
          </div>
        </motion.div>

        {/* Scheduled lessons */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase text-dojo-muted tracking-wider mb-4">Coaching Sessions</h3>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500 bg-opacity-10 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <Calendar size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">{athleteBookings.length} Bookings</h4>
              <p className="text-xs text-dojo-muted mt-1">Total lessons scheduled</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bookings Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Upcoming Mat Sessions</h3>
          {bookingsLoading ? (
            <div className="text-dojo-muted text-sm py-4">Loading sessions...</div>
          ) : athleteBookings.length > 0 ? (
            <div className="space-y-3">
              {athleteBookings.slice(0, 3).map((b) => (
                <div key={b._id} className="p-3 bg-dojo-dark bg-opacity-50 border border-dojo-border rounded flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-bold text-white">{b.coachId?.name || 'Sensei'}</h5>
                    <p className="text-dojo-muted mt-1">{b.slot}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-dojo-card border-dojo-border text-dojo-muted">
                    {b.status}
                  </span>
                </div>
              ))}
              <Link to="/bookings" className="block text-center text-xs font-bold text-dojo-primary hover:underline mt-4">
                View All Bookings
              </Link>
            </div>
          ) : (
            <div className="text-dojo-muted text-sm py-6 text-center border border-dashed border-dojo-border rounded">
              No private classes scheduled yet.
            </div>
          )}
        </div>

        {/* Tournaments Registered */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Open Tournaments</h3>
          {tournaments && tournaments.length > 0 ? (
            <div className="space-y-3">
              {tournaments.slice(0, 3).map((t) => (
                <div key={t._id} className="p-3 bg-dojo-dark bg-opacity-50 border border-dojo-border rounded flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-bold text-white">{t.title}</h5>
                    <p className="text-dojo-muted mt-1">{t.discipline} • {t.location}</p>
                  </div>
                  <Link
                    to="/tournaments"
                    className="px-2.5 py-1 bg-dojo-primary text-white rounded text-[10px] font-bold"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-dojo-muted text-sm py-6 text-center border border-dashed border-dojo-border rounded">
              No active tournaments listed.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  // --------------------------------------------------
  // COACH DASHBOARD VIEW
  // --------------------------------------------------
  const CoachDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-bebas text-white tracking-wide">COACH DASHBOARD</h1>
          <p className="text-dojo-muted mt-1">Manage private class slots, approve requests, and publish tournaments.</p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/tournaments"
            className="px-5 py-2.5 bg-dojo-primary hover:bg-opacity-90 text-white rounded text-xs font-bold uppercase tracking-wider transition shadow-glow-red"
          >
            Create Tournament
          </Link>
          <Link
            to="/bookings"
            className="px-5 py-2.5 border border-dojo-border bg-dojo-card text-white rounded text-xs font-bold uppercase tracking-wider hover:border-dojo-primary transition"
          >
            Manage Bookings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Requests counter */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-dojo-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl uppercase">
            Requests
          </div>
          <h3 className="text-sm font-bold uppercase text-dojo-muted tracking-wider mb-4">Pending Requests</h3>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-dojo-primary bg-opacity-10 border border-dojo-primary flex items-center justify-center text-dojo-primary">
              <Calendar size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">{pendingRequests.length} Pending</h4>
              <p className="text-xs text-dojo-muted mt-1">Awaiting approval</p>
            </div>
          </div>
        </motion.div>

        {/* Total Booked hours */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase text-dojo-muted tracking-wider mb-4">Active Sessions</h3>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-dojo-secondary bg-opacity-10 border border-dojo-secondary flex items-center justify-center text-dojo-secondary">
              <Swords size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">{coachBookings.filter(b => b.status === 'confirmed').length} Active</h4>
              <p className="text-xs text-dojo-muted mt-1">Confirmed appointments</p>
            </div>
          </div>
        </motion.div>

        {/* Gym Locations */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase text-dojo-muted tracking-wider mb-4">Associated Gyms</h3>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500 bg-opacity-10 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <MapPin size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">{gyms?.length || 0} Gyms</h4>
              <p className="text-xs text-dojo-muted mt-1">Discoverable in directory</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pending Bookings Table */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Pending Booking Requests</h3>
        {pendingRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingRequests.map((b) => (
              <div key={b._id} className="p-4 bg-dojo-dark bg-opacity-50 border border-dojo-border rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div>
                  <h5 className="font-bold text-white text-sm">{b.athleteId?.name || 'Athlete'}</h5>
                  <p className="text-dojo-muted mt-1">Requested slot: {b.slot}</p>
                </div>
                <Link
                  to="/bookings"
                  className="px-3.5 py-1.5 bg-dojo-primary text-white rounded font-bold uppercase text-[10px]"
                >
                  Review Request
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-dojo-muted text-sm py-6 text-center border border-dashed border-dojo-border rounded">
            All requests reviewed! Clear schedule.
          </div>
        )}
      </div>
    </motion.div>
  );

  // --------------------------------------------------
  // ADMIN DASHBOARD VIEW
  // --------------------------------------------------
  const AdminDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-5xl font-bebas text-white tracking-wide">ADMIN CONSOLE</h1>
        <p className="text-dojo-muted mt-1">Manage global system metrics, tournaments, and gyms listings.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-xl">
          <span className="text-xs uppercase text-dojo-muted font-bold tracking-wider block">Global Appointments</span>
          <h4 className="text-3xl font-bebas text-white mt-2">{bookings?.length || 0} Sessions</h4>
        </div>
        <div className="glass-panel p-6 rounded-xl">
          <span className="text-xs uppercase text-dojo-muted font-bold tracking-wider block">Tournaments</span>
          <h4 className="text-3xl font-bebas text-white mt-2">{tournaments?.length || 0} Published</h4>
        </div>
        <div className="glass-panel p-6 rounded-xl">
          <span className="text-xs uppercase text-dojo-muted font-bold tracking-wider block">Registered Gyms</span>
          <h4 className="text-3xl font-bebas text-white mt-2">{gyms?.length || 0} Registered</h4>
        </div>
        <div className="glass-panel p-6 rounded-xl">
          <span className="text-xs uppercase text-dojo-muted font-bold tracking-wider block">DevOps State</span>
          <h4 className="text-3xl font-bebas text-emerald-400 mt-2">SECURE</h4>
        </div>
      </div>

      {/* Admin Action Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Quick Administrative Hooks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/tournaments" className="p-3 bg-dojo-dark hover:border-dojo-primary border border-dojo-border text-center rounded text-xs font-semibold block">
              Launch Tournament
            </Link>
            <Link to="/gyms" className="p-3 bg-dojo-dark hover:border-dojo-primary border border-dojo-border text-center rounded text-xs font-semibold block">
              Manage Dojo Directory
            </Link>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 text-xs text-dojo-muted">
          <h3 className="text-lg font-bold text-white mb-2">DevOps Info</h3>
          <p className="mb-2">Helmet headers: <strong className="text-white">Active</strong></p>
          <p className="mb-2">Rate Limiting: <strong className="text-white">Active (100req/15m)</strong></p>
          <p className="mb-2">Axios token interceptor: <strong className="text-white">Active</strong></p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {user.role === 'admin' ? (
        <AdminDashboard />
      ) : user.role === 'coach' ? (
        <CoachDashboard />
      ) : (
        <AthleteDashboard />
      )}
    </div>
  );
};

export default Dashboard;
