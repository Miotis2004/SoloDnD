import React from 'react';
import useGameStore from '../store/useGameStore';
import DashboardLayout from './DashboardLayout';
import CharacterModule from './CharacterModule';
import LogModule from './LogModule';
import ActionModule from './ActionModule';
import DiceModule from './DiceModule';
import CombatTracker from './CombatTracker';
import useNarrativeEngine from '../hooks/useNarrativeEngine';

const GameBoard = () => {
  const { handleChoice, choices } = useNarrativeEngine();
  const { addToLog, rollDice } = useGameStore();

  const handleAction = (actionType) => {
    if (combat.active) {
       // Combat Logic
       const currentPlayer = combat.turnOrder[combat.currentTurnIndex];
       if (currentPlayer.type !== 'player') {
         addToLog({ text: "It's not your turn!", type: 'system' });
         return;
       }

       if (actionType === 'attack') {
          // Auto-target the first living enemy for now
          // Future: Add target selection UI
          const target = combat.turnOrder.find(c => c.type !== 'player' && !c.isDead);
          if (target) {
            performPlayerAttack(target.id);
          } else {
            addToLog({ text: "No valid targets!", type: 'system' });
          }
       } else {
          addToLog({ text: `Action ${actionType} not implemented yet.`, type: 'system' });
       }

    } else {
       // Non-combat interaction (if any)
       addToLog({ text: "You can't do that right now.", type: 'system' });
    }
  };

  return (
    <DashboardLayout>
      <CharacterModule />
      <LogModule />
      {combat.active ? <CombatTracker /> : null}
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
