import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader, Calendar, Clock, CheckCircle2, XCircle, Award } from 'lucide-react';

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      if (response.data.success) {
        setBookings(response.data.bookings);
      }
    } catch (error) {
      console.error('Error loading session bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const response = await api.patch(`/bookings/${bookingId}/status`, { status });
      if (response.data.success) {
        setBookings(
          bookings.map((booking) =>
            booking._id === bookingId ? response.data.booking : booking
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500 bg-opacity-10 text-emerald-400 border-emerald-500 border-opacity-35';
      case 'completed':
        return 'bg-blue-500 bg-opacity-10 text-blue-400 border-blue-500 border-opacity-35';
      case 'cancelled':
        return 'bg-dojo-primary bg-opacity-10 text-dojo-primary border-dojo-primary border-opacity-35';
      default:
        return 'bg-dojo-border bg-opacity-20 text-dojo-muted border-dojo-border';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-dojo-muted">
        <Loader className="animate-spin mr-2" />
        <span>Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-white">Coaching Bookings</h2>
        <p className="mt-1 text-dojo-muted">
          {user.role === 'coach'
            ? 'Manage session requests and schedule training slots with your athletes.'
            : 'Track scheduling status of your requested 1-on-1 private classes.'}
        </p>
      </div>

      <div className="space-y-4">
        {bookings.length > 0 ? (
          bookings.map((booking) => {
            const opponent = user.role === 'coach' ? booking.athlete : booking.coach;
            const isPending = booking.status === 'pending';
            const isConfirmed = booking.status === 'confirmed';
            
            return (
              <div
                key={booking._id}
                className="glass-panel rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:border-opacity-50"
              >
                {/* Profile detail */}
                <div className="flex gap-4 items-center">
                  {opponent?.profileImage ? (
                    <img
                      src={opponent.profileImage}
                      alt={opponent.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dojo-border text-lg font-bold text-dojo-primary uppercase">
                      {opponent?.name ? opponent.name.charAt(0) : '?'}
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-white text-base">{opponent?.name || 'User'}</h3>
                    <p className="text-xs text-dojo-muted flex items-center gap-1.5 mt-1">
                      <span>{user.role === 'coach' ? 'Athlete' : 'Sensei'}</span> •{' '}
                      {opponent?.discipline} • {opponent?.beltRank} Belt
                    </p>
                  </div>
                </div>

                {/* Date slot */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-xs text-dojo-text font-semibold flex items-center gap-1.5">
                    <Calendar size={14} className="text-dojo-primary" />
                    <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-dojo-muted flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>{booking.timeslot}</span>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                  <span
                    className={`text-xs uppercase font-bold tracking-wider px-3 py-1 rounded border ${getStatusStyle(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>

                  {/* Actions depending on Role & State */}
                  <div className="flex gap-2">
                    {/* Coach Controls */}
                    {user.role === 'coach' && isPending && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(booking._id, 'confirmed')}
                          disabled={actionLoading[booking._id]}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                          disabled={actionLoading[booking._id]}
                          className="p-1.5 bg-dojo-primary hover:bg-opacity-90 text-white rounded text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {user.role === 'coach' && isConfirmed && (
                      <button
                        onClick={() => handleUpdateStatus(booking._id, 'completed')}
                        disabled={actionLoading[booking._id]}
                        className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                      >
                        <Award size={14} />
                        <span>Complete</span>
                      </button>
                    )}

                    {/* Athlete controls */}
                    {user.role === 'athlete' && (isPending || isConfirmed) && (
                      <button
                        onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                        disabled={actionLoading[booking._id]}
                        className="p-1.5 border border-dojo-border text-dojo-muted hover:text-dojo-primary hover:border-dojo-primary rounded text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        <span>Cancel Booking</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 border border-dashed border-dojo-border rounded-lg text-dojo-muted">
            No booking records found. Check coaches tab to coordinate training sessions!
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
