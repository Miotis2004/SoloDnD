import React, { useState } from 'react';
import { Settings, Users } from 'lucide-react';
import PreferencesModal from './PreferencesModal';
import CharacterSelectModal from './CharacterSelectModal';

const DashboardLayout = ({ children }) => {
  const [showPrefs, setShowPrefs] = useState(false);
  const [showChars, setShowChars] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-dnd-dark to-black text-slate-300 p-4 md:p-6 lg:p-8">
      <header className="mb-6 border-b border-slate-800 pb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Campaign: The Lost Mines</h1>
        <div className="flex gap-2">
            <button
            onClick={() => setShowChars(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
            title="Switch Character"
            >
                <Users size={20} />
            </button>
            <button
            onClick={() => setShowPrefs(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
            >
                <Settings size={20} />
            </button>
        </div>
      </header>
      
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
        {children}
      </main>

      <PreferencesModal isOpen={showPrefs} onClose={() => setShowPrefs(false)} />
      <CharacterSelectModal isOpen={showChars} onClose={() => setShowChars(false)} />
    </div>
  );
};

export default DashboardLayout;
