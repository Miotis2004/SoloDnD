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
  const { combat, initiatePlayerAttack, addToLog } = useGameStore();

  const handleAction = (actionType, targetId, spellId) => {
    if (combat.active) {
       // Combat Logic
       const currentPlayer = combat.turnOrder[combat.currentTurnIndex];
       if (currentPlayer.type !== 'player') {
         addToLog({ text: "It's not your turn!", type: 'system' });
         return;
       }

       if (actionType === 'attack') {
          if (targetId) {
            initiatePlayerAttack(targetId);
          } else {
            addToLog({ text: "No target selected!", type: 'system' });
          }
       } else if (actionType === 'cast') {
          // targetId is target, spellId is... passed as 3rd arg
          if (spellId) {
             useGameStore.getState().castSpell(targetId, spellId);
          } else {
             addToLog({ text: "No spell selected!", type: 'system' });
          }
       } else {
          addToLog({ text: `Action ${actionType} not implemented yet.`, type: 'system' });
       }

    } else {
       // Non-combat interaction
       if (actionType === 'rest') {
           useGameStore.getState().performLongRest();
       } else if (actionType === 'cast') {
           if (spellId) {
               useGameStore.getState().castSpell(targetId, spellId);
           }
       } else {
           addToLog({ text: "You can't do that right now.", type: 'system' });
       }
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
