import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { Sword, Skull } from 'lucide-react';

const LoginScreen = () => {
  const { login, register, error, loading } = useAuthStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegistering) {
      await register(email, password);
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2544&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

      <div className="relative z-10 w-full max-w-md bg-slate-900/90 border border-slate-700 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
            <div className="flex justify-center mb-4 text-dnd-accent">
                <Sword size={48} />
            </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Solo Adventure
          </h1>
          <p className="text-slate-400">Enter the dungeon if you dare.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-dnd-accent focus:border-transparent outline-none transition-all"
              placeholder="adventurer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-dnd-accent focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-200 text-sm p-3 rounded-lg flex items-center gap-2">
                <Skull size={16} />
                {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dnd-accent hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Create Character' : 'Enter World')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-slate-400 hover:text-white text-sm underline decoration-slate-600 underline-offset-4"
          >
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
