import React, { useEffect } from 'react';
import GameBoard from './components/GameBoard';
import LoginScreen from './components/LoginScreen';
import useAuthStore from './store/useAuthStore';
import useGameStore from './store/useGameStore';

function App() {
  const { user, initializeListener, loading } = useAuthStore();
  const { loadGame } = useGameStore();

  useEffect(() => {
    const unsubscribe = initializeListener();
    return () => unsubscribe();
  }, [initializeListener]);

  useEffect(() => {
    if (user?.uid) {
        loadGame(user.uid);
    }
  }, [user, loadGame]);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-slate-500">Loading Realm...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <GameBoard />
  );
}

export default App;
