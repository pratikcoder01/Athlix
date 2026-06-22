import React, { useState } from 'react';
import { useGyms } from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Search, MapPin, Loader, Plus, Swords } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const Gyms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [location, setLocation] = useState('');
  
  const { data: gyms, isLoading } = useGyms(search, discipline, location);
  
  // Create Gym Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gymDiscipline, setGymDiscipline] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [gymLocation, setGymLocation] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreateGymSubmit = async (e) => {
    e.preventDefault();
    if (!name || !address || !gymLocation) return;

    setCreateLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/gyms', {
        name,
        address,
        discipline: gymDiscipline.split(',').map((d) => d.trim()),
        images: imageUrl ? [imageUrl.trim()] : [],
        location: gymLocation,
      });

      if (response.data.success) {
        setSuccessMsg('Gym registered successfully in DojoPro directory!');
        queryClient.invalidateQueries({ queryKey: ['gyms'] });
        setName('');
        setAddress('');
        setGymDiscipline('');
        setImageUrl('');
        setGymLocation('');
        setTimeout(() => setShowCreateModal(false), 2000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to register Gym/Dojo');
    } finally {
      setCreateLoading(false);
    }
  };

  const disciplines = ['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Gym Discovery</h2>
          <p className="mt-1 text-dojo-muted">Search nearby dojos, combat academies, and training venues.</p>
        </div>

        {/* Action Header Button */}
        {user.role !== 'athlete' && (
          <button
            onClick={() => {
              setShowCreateModal(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-dojo-primary hover:bg-opacity-90 text-white rounded text-sm font-semibold transition"
          >
            <Plus size={16} />
            <span>Register Gym</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-dojo-muted" />
          <input
            type="text"
            placeholder="Search gym by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded bg-dojo-card border border-dojo-border pl-9 pr-4 py-2 text-sm text-white focus:outline-none"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-dojo-muted" />
          <input
            type="text"
            placeholder="Filter by city/location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded bg-dojo-card border border-dojo-border pl-9 pr-4 py-2 text-sm text-white focus:outline-none"
          />
        </div>

        <select
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          className="rounded bg-dojo-card border border-dojo-border px-4 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">All Taught Disciplines</option>
          {disciplines.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {successMsg && (
        <div className="mb-6 rounded bg-emerald-500 bg-opacity-10 border border-emerald-500 p-4 text-sm text-emerald-400">
          {successMsg}
        </div>
      )}

      {/* Gym Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-dojo-muted">
          <Loader className="animate-spin mr-2" />
          <span>Searching dojo directory...</span>
        </div>
      ) : gyms && gyms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gyms.map((gym) => (
            <div key={gym._id} className="glass-panel rounded-xl overflow-hidden hover:border-dojo-primary transition duration-300 flex flex-col justify-between">
              {/* Gym Image */}
              <div className="h-48 w-full bg-dojo-dark relative">
                {gym.images && gym.images.length > 0 ? (
                  <img src={gym.images[0]} alt={gym.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-dojo-muted text-xs">
                    No Academy Image Uploaded
                  </div>
                )}
                
                {/* Location indicator tag */}
                <span className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-[10px] font-bold text-white px-2 py-0.5 rounded flex items-center gap-0.5">
                  <MapPin size={10} className="text-dojo-primary" />
                  <span>{gym.location}</span>
                </span>
              </div>

              {/* Gym Details */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1.5">{gym.name}</h3>
                  <p className="text-xs text-dojo-muted mb-4">{gym.address}</p>
                </div>

                {/* Disciplines tags list */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {gym.discipline.map((d, idx) => (
                    <span key={idx} className="text-[10px] font-bold bg-dojo-primary bg-opacity-10 text-dojo-primary border border-dojo-primary border-opacity-25 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                      <Swords size={8} />
                      <span>{d}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-dojo-border rounded-lg text-dojo-muted">
          No academies registered matching filters.
        </div>
      )}

      {/* Create Gym Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 px-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-dojo-muted hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-white mb-4 font-bebas uppercase tracking-wider">Register Dojo Academy</h3>

            {errorMsg && (
              <div className="mb-4 rounded bg-dojo-primary bg-opacity-10 border border-dojo-primary p-3 text-xs text-dojo-primary">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateGymSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-dojo-muted block mb-1">Academy Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alliance Jiu-Jitsu HQ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                />
              </div>

              <div>
                <label className="text-xs text-dojo-muted block mb-1">Full Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123 Main St, New York"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dojo-muted block mb-1">City/Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New York"
                    value={gymLocation}
                    onChange={(e) => setGymLocation(e.target.value)}
                    className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-dojo-muted block mb-1">Disciplines (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. BJJ, Judo, MMA"
                    value={gymDiscipline}
                    onChange={(e) => setGymDiscipline(e.target.value)}
                    className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-dojo-muted block mb-1">Showcase Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-xs text-white focus:outline-none"
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
                  className="px-5 py-2 bg-dojo-primary text-sm text-white rounded hover:bg-opacity-90 flex items-center gap-1.5 transition disabled:opacity-50 font-bold"
                >
                  {createLoading ? <Loader className="animate-spin" size={16} /> : null}
                  <span>Register Gym</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gyms;
