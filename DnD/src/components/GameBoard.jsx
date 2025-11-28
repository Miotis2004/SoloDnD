import React from 'react';
import useGameStore from '../store/useGameStore';
import DashboardLayout from './DashboardLayout';
import CharacterModule from './CharacterModule';
import LogModule from './LogModule';
import ActionModule from './ActionModule';
import DiceModule from './DiceModule';
import useNarrativeEngine from '../hooks/useNarrativeEngine';

const GameBoard = () => {
  const { handleChoice, choices } = useNarrativeEngine();
  const { addToLog, rollDice } = useGameStore();

  const handleAction = (actionType) => {
    // Basic Combat Logic Hook
    if (actionType === 'attack') {
      const { roll, total } = rollDice(20, 5); // Mock +5 to hit
      addToLog({ 
        text: `You swing your weapon! Rolled ${roll} + 5 = ${total} to hit.`,
        type: 'combat'
      });
    } else {
        addToLog({ text: `Action ${actionType} performed.`, type: 'system' });
    }
  };

  return (
    <DashboardLayout>
      <CharacterModule />
      <LogModule />
      <ActionModule 
        onAction={handleAction} 
        narrativeChoices={choices}
        onNarrativeChoice={handleChoice}
      />
      <DiceModule />
    </DashboardLayout>
  );
};

export default GameBoard;
