import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import PreferencesModal from './PreferencesModal';

const DashboardLayout = ({ children }) => {
  const [showPrefs, setShowPrefs] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-dnd-dark to-black text-slate-300 p-4 md:p-6 lg:p-8">
      <header className="mb-6 border-b border-slate-800 pb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Campaign: The Lost Mines</h1>
        <button
          onClick={() => setShowPrefs(true)}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
        >
            <Settings size={20} />
        </button>
      </header>
      
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
        {children}
      </main>

      <PreferencesModal isOpen={showPrefs} onClose={() => setShowPrefs(false)} />
    </div>
  );
};

export default DashboardLayout;
