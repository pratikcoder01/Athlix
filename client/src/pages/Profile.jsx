import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Edit2, Save, FileVideo, Upload, Loader, Award, BookOpen, MapPin, Instagram, Twitter, Linkedin, Plus, Trash2 } from 'lucide-react';

const Profile = () => {
  const { user, updateProfileState } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [discipline, setDiscipline] = useState(user?.discipline || 'BJJ');
  const [beltRank, setBeltRank] = useState(user?.beltRank || 'White');
  const [location, setLocation] = useState(user?.location || '');
  const [achievements, setAchievements] = useState(user?.achievements || []);
  const [newAchievement, setNewAchievement] = useState('');
  
  // Social links states
  const [instagram, setInstagram] = useState(user?.socialLinks?.instagram || '');
  const [twitter, setTwitter] = useState(user?.socialLinks?.twitter || '');
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin || '');

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-dojo-muted">
        Loading profile data...
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaveLoading(true);

    try {
      const response = await api.put(`/users/${user.id}`, {
        name,
        bio,
        discipline,
        beltRank,
        location,
        achievements,
        socialLinks: { instagram, twitter, linkedin },
      });
      if (response.data.success) {
        updateProfileState(response.data.user);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setAvatarLoading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/profile/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        updateProfileState(response.data.user);
        setSuccess('Profile image updated!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading profile image');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    e.preventDefault();
    const fileInput = e.target.elements.video;
    const file = fileInput.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setVideoLoading(true);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', videoTitle);

    try {
      const response = await api.post('/profile/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        updateProfileState(response.data.user);
        setVideoTitle('');
        fileInput.value = '';
        setSuccess('Training video uploaded successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading video file');
    } finally {
      setVideoLoading(false);
    }
  };

  const addAchievement = () => {
    if (!newAchievement.trim()) return;
    setAchievements([...achievements, newAchievement.trim()]);
    setNewAchievement('');
  };

  const removeAchievement = (index) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const disciplines = ['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA'];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Notifications */}
      {error && (
        <div className="mb-6 rounded-md bg-dojo-primary bg-opacity-10 border border-dojo-primary p-4 text-sm text-dojo-primary">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-md bg-emerald-500 bg-opacity-10 border border-emerald-500 p-4 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Profile Card */}
      <div className="glass-panel rounded-xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-dojo-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl">
          {user.role}
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar Section */}
          <div className="relative group flex flex-col items-center">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="h-32 w-32 rounded-full border-2 border-dojo-primary object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-dojo-border border-2 border-dojo-border text-4xl font-extrabold text-dojo-primary uppercase">
                {user.name.charAt(0)}
              </div>
            )}
            
            <label className="mt-4 flex items-center space-x-1.5 text-xs text-dojo-muted cursor-pointer hover:text-dojo-primary transition">
              {avatarLoading ? (
                <Loader className="animate-spin" size={14} />
              ) : (
                <Upload size={14} />
              )}
              <span>{avatarLoading ? 'Uploading...' : 'Change Avatar'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={avatarLoading}
                className="hidden"
              />
            </label>
          </div>

          {/* Details Section */}
          <div className="flex-1 w-full">
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Belt Rank</label>
                    <input
                      type="text"
                      value={beltRank}
                      onChange={(e) => setBeltRank(e.target.value)}
                      required
                      className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Discipline</label>
                    <select
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                      className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                    >
                      {disciplines.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. New York, USA"
                      className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none focus:border-dojo-primary"
                    placeholder="Tell the dojo community about yourself..."
                  />
                </div>

                {/* Achievements Edit */}
                <div>
                  <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Achievements / Badges</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newAchievement}
                      onChange={(e) => setNewAchievement(e.target.value)}
                      placeholder="Add award, title, tournament win..."
                      className="flex-1 rounded bg-dojo-dark border border-dojo-border p-2 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addAchievement}
                      className="px-3 bg-dojo-border border border-dojo-border text-white hover:text-dojo-primary rounded"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {achievements.map((ach, idx) => (
                      <span key={idx} className="text-xs bg-dojo-border text-white px-2.5 py-1 rounded flex items-center gap-1">
                        <span>{ach}</span>
                        <button type="button" onClick={() => removeAchievement(idx)} className="text-dojo-primary font-bold">✕</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Links Edit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Instagram URL</label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Twitter URL</label>
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://twitter.com/..."
                      className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-dojo-border text-sm text-dojo-muted rounded hover:bg-dojo-dark transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-5 py-2 bg-dojo-primary text-sm text-white rounded hover:bg-opacity-90 flex items-center gap-1.5 transition disabled:opacity-50 font-bold"
                  >
                    {saveLoading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                    <span>Save</span>
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-extrabold text-white">{user.name}</h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 border border-dojo-border text-dojo-muted hover:text-dojo-primary hover:border-dojo-primary rounded transition"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                {/* Badge tags */}
                <div className="flex flex-wrap gap-2.5 mt-3">
                  <span className="flex items-center gap-1 text-[11px] font-bold bg-dojo-primary bg-opacity-10 border border-dojo-primary border-opacity-30 text-dojo-primary px-3 py-1 rounded-full uppercase">
                    <Award size={13} />
                    <span>{user.discipline}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold bg-dojo-secondary bg-opacity-10 border border-dojo-secondary border-opacity-30 text-dojo-secondary px-3 py-1 rounded-full uppercase">
                    <BookOpen size={13} />
                    <span>{user.beltRank} Belt</span>
                  </span>
                  {user.location && (
                    <span className="flex items-center gap-1 text-[11px] font-bold bg-dojo-border text-dojo-muted px-3 py-1 rounded-full">
                      <MapPin size={12} />
                      <span>{user.location}</span>
                    </span>
                  )}
                </div>

                <p className="mt-6 text-dojo-text text-sm leading-relaxed">
                  {user.bio || "No bio description written yet."}
                </p>

                {/* Achievements List */}
                {user.achievements && user.achievements.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-dojo-muted mb-2">Logged Achievements</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.achievements.map((ach, idx) => (
                        <span key={idx} className="text-xs border border-dojo-border bg-dojo-dark px-2.5 py-1 rounded text-white font-medium">
                          🏆 {ach}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social links row */}
                {user.socialLinks && (
                  <div className="flex gap-4 mt-6 text-dojo-muted border-t border-dojo-border pt-4">
                    {user.socialLinks.instagram && (
                      <a href={user.socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:text-dojo-primary transition">
                        <Instagram size={18} />
                      </a>
                    )}
                    {user.socialLinks.twitter && (
                      <a href={user.socialLinks.twitter} target="_blank" rel="noreferrer" className="hover:text-dojo-primary transition">
                        <Twitter size={18} />
                      </a>
                    )}
                    {user.socialLinks.linkedin && (
                      <a href={user.socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-dojo-primary transition">
                        <Linkedin size={18} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel rounded-xl p-6 h-fit">
          <h3 className="text-lg font-bold text-white mb-4">Add Practice Video</h3>
          <form onSubmit={handleVideoUpload} className="space-y-4">
            <div>
              <label className="text-xs text-dojo-muted block mb-1">Title</label>
              <input
                type="text"
                required
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g. Boxing pads practice"
                className="w-full rounded bg-dojo-dark border border-dojo-border p-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            
            <div>
              <label className="text-xs text-dojo-muted block mb-1">Select File</label>
              <input
                type="file"
                name="video"
                required
                accept="video/*"
                className="w-full text-xs text-dojo-muted file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-dojo-border file:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={videoLoading}
              className="w-full py-2.5 bg-dojo-primary text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-opacity-95 flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-glow-red"
            >
              {videoLoading ? <Loader className="animate-spin" size={14} /> : <FileVideo size={14} />}
              <span>Upload Video</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-panel rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Training Video reels</h3>
          {user.trainingVideos && user.trainingVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {user.trainingVideos.map((video) => (
                <div key={video._id} className="border border-dojo-border rounded-lg overflow-hidden bg-dojo-dark">
                  <video src={video.url} controls className="w-full aspect-video object-cover" />
                  <div className="p-3 text-xs">
                    <h4 className="font-bold text-white truncate">{video.title}</h4>
                    <p className="text-dojo-muted mt-1">Uploaded {new Date(video.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-dojo-border rounded-lg text-dojo-muted text-sm">
              No training video reels uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
