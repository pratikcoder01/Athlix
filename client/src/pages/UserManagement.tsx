import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Trash2, CheckCircle } from 'lucide-react';

const UserManagement: React.FC = () => {
  // Mock users data for MVP admin console
  const [users, setUsers] = useState([
    { id: '1', name: 'Pratik', email: 'pratik@athlix.com', role: 'admin', status: 'Active' },
    { id: '2', name: 'Kirat', email: 'kirat@athlix.com', role: 'coach', status: 'Active' },
    { id: '3', name: 'Shravan', email: 'shravan@athlix.com', role: 'athlete', status: 'Active' },
    { id: '4', name: 'Anuja', email: 'anuja@athlix.com', role: 'academy_owner', status: 'Pending Verification' },
  ]);

  const handleVerify = (id: string) => {
    setUsers(prev =>
      prev.map(user => (user.id === id ? { ...user, status: 'Active' } : user))
    );
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  return (
    <div className="min-h-screen bg-athlix-dark text-athlix-text py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-athlix-border pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-athlix-primary font-bebas tracking-wide">
              ADMIN: USER MANAGEMENT
            </h1>
            <p className="text-athlix-muted text-sm mt-1">Review credentials and roles across the platform</p>
          </div>
          <Shield className="h-10 w-10 text-athlix-primary animate-pulse" />
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
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-athlix-muted uppercase tracking-wider font-bebas text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-athlix-border">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-athlix-dark transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-athlix-border flex items-center justify-center">
                        <User className="h-4 w-4 text-athlix-primary" />
                      </div>
                      <span className="font-semibold text-athlix-text">{user.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-athlix-muted text-sm">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-athlix-border text-athlix-secondary">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        user.status === 'Active' ? 'bg-green-900 bg-opacity-35 text-athlix-success' : 'bg-yellow-900 bg-opacity-35 text-athlix-secondary'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        {user.status !== 'Active' && (
                          <button
                            onClick={() => handleVerify(user.id)}
                            className="text-athlix-success hover:text-opacity-80 transition-colors"
                            title="Verify User Account"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-athlix-primary hover:text-opacity-80 transition-colors"
                          title="Delete User"
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

export default UserManagement;
