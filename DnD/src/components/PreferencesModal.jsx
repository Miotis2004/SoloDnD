import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useGameStore from '../store/useGameStore';
import { LogOut, Save, RotateCcw, ShieldAlert, User as UserIcon } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import AdminDashboard from './AdminDashboard';

const PreferencesModal = ({ isOpen, onClose }) => {
  const {
    logout,
    user,
    profile,
    profileLoading,
    profileError,
    updateProfileField,
    saveProfile,
    loadProfile
  } = useAuthStore();
  const { saveGame } = useGameStore();
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (isOpen && user?.uid) {
      loadProfile(user.uid);
    }
  }, [isOpen, user, loadProfile]);

  const handleSave = () => {
    if (user?.uid) {
        saveGame(user.uid);
    }
  };

  const handleProfileSave = async () => {
    if (!user?.uid) return;
    await saveProfile(user.uid);
  };

  if (showAdmin) {
      return <AdminDashboard onClose={() => setShowAdmin(false)} />;
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl"
        >
          <div className="p-4 border-b border-slate-800 bg-slate-950/50">
            <h2 className="text-lg font-bold text-white">Player Preferences</h2>
          </div>

          <div className="p-4 space-y-3">
             <div className="text-sm text-slate-400 mb-4 text-center">
                Logged in as <span className="text-white">{user?.email}</span>
             </div>

             <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <UserIcon size={16} /> Player Profile
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <label className="space-y-1 text-sm">
                    <span className="text-slate-400">Display Name</span>
                    <input
                      value={profile.displayName}
                      onChange={(e) => updateProfileField('displayName', e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-red-500 focus:outline-none"
                      placeholder="e.g. Aria the Bold"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-slate-400">Pronouns</span>
                    <input
                      value={profile.pronouns}
                      onChange={(e) => updateProfileField('pronouns', e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-red-500 focus:outline-none"
                      placeholder="she/her, he/him, they/them"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-slate-400">About You</span>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => updateProfileField('bio', e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-red-500 focus:outline-none resize-none"
                      placeholder="Notes for party members or the DM"
                      rows={3}
                    />
                  </label>
                </div>

                {profileError && (
                  <div className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded p-2">
                    {profileError}
                  </div>
                )}

                <button
                  onClick={handleProfileSave}
                  disabled={profileLoading}
                  className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-600 text-slate-200 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={18} />
                  {profileLoading ? 'Saving Profile...' : 'Save Profile'}
                </button>
             </div>

             <button
                onClick={handleSave}
                className="w-full bg-blue-900/40 hover:bg-blue-900/60 border border-blue-800 text-blue-200 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
             >
                <Save size={18} />
                Save Game
             </button>

             <button
                onClick={() => window.location.reload()}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
             >
                <RotateCcw size={18} />
                Reload Application
             </button>

             <button
                onClick={() => setShowAdmin(true)}
                className="w-full bg-red-950/30 hover:bg-red-950/50 border border-red-900/30 text-red-700 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
             >
                <ShieldAlert size={18} />
                Admin Mode
             </button>

             <hr className="border-slate-800 my-2" />

             <button
                onClick={logout}
                className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
             >
                <LogOut size={18} />
                Logout
             </button>
          </div>

          <div className="p-3 bg-slate-950/50 border-t border-slate-800 text-center">
            <button
                onClick={onClose}
                className="text-slate-400 hover:text-white text-sm"
            >
                Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PreferencesModal;
