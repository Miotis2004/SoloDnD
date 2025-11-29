import React, { useEffect, useState } from 'react';
import useGameStore from '../store/useGameStore';
import useAuthStore from '../store/useAuthStore';
import { Plus, Play } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import CharacterCreator from './CharacterCreator';

const CharacterSelectModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { loadCharacterList, characterList, loadGame } = useGameStore();
  const [view, setView] = useState('list'); // 'list' or 'create'

  useEffect(() => {
    if (isOpen && user?.uid) {
        loadCharacterList(user.uid);
        // Only reset view if switching to open
        const timer = setTimeout(() => setView('list'), 0);
        return () => clearTimeout(timer);
    }
  }, [isOpen, user, loadCharacterList]);

  const handlePlay = (charId) => {
      loadGame(user.uid, charId);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[600px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">
                {view === 'list' ? 'Select Character' : 'Create New Character'}
            </h2>
            {view === 'list' && (
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-white"
                >
                    Close
                </button>
            )}
          </div>

          <div className="flex-1 p-6 overflow-hidden">
             {view === 'list' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-y-auto custom-scrollbar content-start">
                    {/* New Character Card */}
                    <button
                        onClick={() => setView('create')}
                        className="h-40 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 transition-all group"
                    >
                        <div className="p-3 bg-slate-800 rounded-full group-hover:scale-110 transition-transform mb-2">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold">Create New</span>
                    </button>

                    {/* Character List */}
                    {characterList.map((char, index) => (
                        <div key={char.id || index} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:border-dnd-accent transition-colors group relative">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-white">{char.name || "Unknown"}</h3>
                                    <div className="bg-slate-900 text-xs px-2 py-1 rounded text-slate-400">Lvl {char.level || 1}</div>
                                </div>
                                <div className="text-sm text-dnd-accent font-medium mb-1">{char.race || "Human"} {char.class || "Fighter"}</div>
                                <div className="text-xs text-slate-500 mt-2">
                                    HP: {char.hp?.current || 0}/{char.hp?.max || 0}
                                </div>
                            </div>

                            <button
                                onClick={() => handlePlay(char.id)}
                                className="mt-4 w-full bg-slate-700 hover:bg-green-700 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors font-bold"
                            >
                                <Play size={16} /> Play
                            </button>
                        </div>
                    ))}
                 </div>
             ) : (
                 <CharacterCreator
                    onCancel={() => setView('list')}
                    onComplete={() => {
                        onClose(); // Close modal on success (game loads auto)
                    }}
                 />
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CharacterSelectModal;
