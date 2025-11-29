import React, { useEffect, useState } from 'react';
import GameBoard from './components/GameBoard';
import LoginScreen from './components/LoginScreen';
import CharacterSelectModal from './components/CharacterSelectModal';
import useAuthStore from './store/useAuthStore';
import useGameStore from './store/useGameStore';

function App() {
  const { user, initializeListener, loading } = useAuthStore();
  const { character, initializeContent } = useGameStore();
  const [isCharacterModalOpen, setCharacterModalOpen] = useState(false);

  useEffect(() => {
    // Start fetching dynamic content early
    initializeContent();
    const unsubscribe = initializeListener();
    return () => unsubscribe();
  }, [initializeListener, initializeContent]);

  useEffect(() => {
    // If logged in but no character ID loaded (and not strictly loading), show selection
    if (user && !loading && !character.id) {
        // Use timeout to push this to next tick, avoiding synchronous update warning during render phase
        const timer = setTimeout(() => setCharacterModalOpen(true), 0);
        return () => clearTimeout(timer);
    } else {
        const timer = setTimeout(() => setCharacterModalOpen(false), 0);
        return () => clearTimeout(timer);
    }
  }, [user, loading, character.id]);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-slate-500">Loading Realm...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <>
        <GameBoard />
        <CharacterSelectModal
            isOpen={isCharacterModalOpen}
            onClose={() => setCharacterModalOpen(false)} // Should ideally prevent closing if no char selected, but logic handles it
        />
    </>
  );
}

export default App;
