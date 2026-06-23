import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Plus, Edit3, Trash2 } from 'lucide-react';

const TournamentManagement: React.FC = () => {
  // Mock data for tournaments in MVP console
  const [tournaments, setTournaments] = useState([
    { id: '1', title: 'Grand Submission League', date: '2026-07-15', location: 'Las Vegas, NV', fee: '$50', status: 'upcoming' },
    { id: '2', title: 'Iron Fist Muay Thai Cup', date: '2026-08-20', location: 'Bangkok, TH', fee: '$45', status: 'upcoming' },
    { id: '3', title: 'Tokyo Grappling Masters', date: '2026-06-10', location: 'Tokyo, JP', fee: '$60', status: 'completed' },
  ]);

  const handleDelete = (id: string) => {
    setTournaments(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-athlix-dark text-athlix-text py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-athlix-border pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-athlix-primary font-bebas tracking-wide">
              ADMIN: TOURNAMENT MANAGEMENT
            </h1>
            <p className="text-athlix-muted text-sm mt-1">Manage platform events, rules, entries, and brackets</p>
          </div>
          <button className="flex items-center gap-2 bg-athlix-primary hover:bg-opacity-90 transition-all px-4 py-2 rounded-md font-bebas tracking-widest text-sm text-athlix-text">
            <Plus className="h-4 w-4" /> CREATE TOURNAMENT
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-athlix-card border border-athlix-border rounded-lg overflow-hidden shadow-xl"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-athlix-border text-left">
              <thead className="bg-athlix-dark">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas">Event Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas">Entry Fee</th>
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-athlix-border">
                {tournaments.map(t => (
                  <tr key={t.id} className="hover:bg-athlix-dark transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-athlix-border flex items-center justify-center">
                        <Award className="h-4 w-4 text-athlix-secondary" />
                      </div>
                      <span className="font-semibold text-athlix-text">{t.title}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-athlix-muted text-sm">{t.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-athlix-muted text-sm">{t.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-athlix-secondary">{t.fee}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        t.status === 'upcoming' ? 'bg-blue-900 bg-opacity-35 text-blue-400' : 'bg-green-900 bg-opacity-35 text-athlix-success'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button className="text-athlix-muted hover:text-athlix-text transition-colors">
                          <Edit3 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-athlix-primary hover:text-opacity-80 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TournamentManagement;
