import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Bell, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mock settings state
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [progressionLog, setProgressionLog] = useState(true);

  if (!user) return null;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Mock update endpoint (using user update route under PUT /api/users/:id)
      const response = await api.put(`/users/${user.id}`, {
        password: newPassword, // Hits UserSchema pre-save hook to re-hash automatically
      });

      if (response.data.success) {
        setSuccessMsg('Account password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update account password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-white">Account Settings</h2>
        <p className="mt-1 text-dojo-muted">Manage DojoPro security standards and communication channels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar panel */}
        <div className="space-y-2">
          <div className="p-3 bg-dojo-card bg-opacity-50 text-dojo-primary border-l-2 border-dojo-primary font-bold text-sm rounded-r flex items-center gap-2">
            <Shield size={16} />
            <span>Profile & Security</span>
          </div>
          <div className="p-3 text-dojo-muted hover:text-white font-medium text-sm rounded flex items-center gap-2 cursor-pointer transition">
            <Bell size={16} />
            <span>Notifications</span>
          </div>
        </div>

        {/* Content Panel */}
        <div className="md:col-span-2 space-y-6">
          {successMsg && (
            <div className="rounded-md bg-emerald-500 bg-opacity-10 border border-emerald-500 p-4 text-xs text-emerald-400">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-md bg-dojo-primary bg-opacity-10 border border-dojo-primary p-4 text-xs text-dojo-primary">
              {errorMsg}
            </div>
          )}

          {/* Security details Box */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lock size={18} className="text-dojo-primary" />
              <span>Change Security Password</span>
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-dojo-muted uppercase tracking-wider block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded bg-dojo-dark border border-dojo-border p-2 text-sm text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-dojo-primary text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-opacity-95 transition disabled:opacity-50 shadow-glow-red"
              >
                {loading ? 'Processing...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Notifications toggles Box */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Bell size={18} className="text-dojo-primary" />
              <span>Dojo Notifications Preferences</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-white text-sm">Push Notifications</h5>
                  <p className="text-xs text-dojo-muted mt-0.5">Receive immediate notifications on booking requests approvals.</p>
                </div>
                <input
                  type="checkbox"
                  checked={pushNotif}
                  onChange={(e) => setPushNotif(e.target.checked)}
                  className="rounded bg-dojo-dark border-dojo-border text-dojo-primary focus:ring-dojo-primary"
                />
              </div>

              <div className="flex items-center justify-between border-t border-dojo-border pt-4">
                <div>
                  <h5 className="font-bold text-white text-sm">Email Digests</h5>
                  <p className="text-xs text-dojo-muted mt-0.5">Receive weekly tournament agendas and discovery bulletins.</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.checked)}
                  className="rounded bg-dojo-dark border-dojo-border text-dojo-primary focus:ring-dojo-primary"
                />
              </div>

              <div className="flex items-center justify-between border-t border-dojo-border pt-4">
                <div>
                  <h5 className="font-bold text-white text-sm">Progression Alerts</h5>
                  <p className="text-xs text-dojo-muted mt-0.5">Receive notifications when your belt achievements are tagged by a coach.</p>
                </div>
                <input
                  type="checkbox"
                  checked={progressionLog}
                  onChange={(e) => setProgressionLog(e.target.checked)}
                  className="rounded bg-dojo-dark border-dojo-border text-dojo-primary focus:ring-dojo-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
