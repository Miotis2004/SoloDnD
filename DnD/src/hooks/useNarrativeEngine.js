import React, { useEffect } from 'react';
import useGameStore, { monsterLookup } from '../store/useGameStore';

// This component doesn't render UI, it manages the logic bridge between the Store and the JSON
const useNarrativeEngine = () => {
  const { 
    currentNodeId, 
    activeAdventure,
    setCurrentNode, 
    addToLog, 
    setGameMode, 
    character, 
    startCombat
  } = useGameStore();
  
  // Derive choices directly from the current node ID and data
  // Note: activeAdventure might be null if loading
  const node = activeAdventure?.nodes ? activeAdventure.nodes[currentNodeId] : null;
  const choices = node?.choices || [];

  // Flatten monster data for easier lookup
  // Note: We need dynamic monster lookup now. Assuming enemies are loaded or just passing ID.
  // The 'startCombat' function in store takes 'enemies' object array.
  // We need to look them up from Firestore.
  // BUT `useNarrativeEngine` logic was: map enemy ID to monster object.
  // We don't have local `monsterData` anymore.
  // We need `itemLookup` style lookup for monsters.
  // Since we don't have a `monsterLookup` in store yet, we might need to fetch them or rely on admin service?
  // Actually, for this cleanup step, I should have added `monsterLookup` to store in Step 1 if I removed the file.
  // However, `useGameStore` `initializeContent` does NOT fetch monsters into a lookup.
  // Limitation: I will skip monster lookup for now and pass raw IDs if objects missing?
  // No, `startCombat` expects objects with HP/AC.
  // FIX: I will assume the adventure node stores the *full* enemy object or I need to fetch it.
  // Most likely: The adventure node stores IDs "goblin".
  // Without `monsters.json`, I can't look "goblin" up unless I fetch it.
  // For now, I will remove the `allMonsters` memo and `useEffect` logic will fail to find enemy if not implemented.
  // I will add a TODO or basic fallback.
  // WAIT: The user asked to remove JSON files.
  // I should essentially break the monster lookup here unless I add `monsterLookup` to store.
  // I will proceed with removing the file import.

  // Actually, I can't easily add `monsterLookup` to store in this single file edit.
  // I will remove the logic that depends on `monsterData` and `defaultAdventureData`.

  useEffect(() => {
    if (!activeAdventure) return; // Wait for load

    if (!node) {
      console.error("Node not found:", currentNodeId);
      return;
    }

    addToLog({ 
      text: node.text, 
      type: node.type || 'narrative',
      title: node.type === 'combat' ? 'Combat Encounter' : null
    });

    // 3. Handle Node Type
    if (node.type === 'combat') {
      // Look up enemies from flattened list
      const enemies = (node.enemies || []).map(id => monsterLookup[id]).filter(Boolean);

      if (enemies.length > 0) {
        startCombat(enemies, node.on_victory, node.on_defeat);
      } else {
        console.error("No valid enemies found for combat node", node.enemies);
        setGameMode('narrative'); // Fallback
      }
    } else {
      setGameMode('narrative');
    }

  }, [currentNodeId, addToLog, setGameMode, node, startCombat, activeAdventure]);

  const handleChoice = (choice) => {
    // Special Actions defined in Adventure JSON
    if (choice.action === 'loot') {
        useGameStore.getState().lootBodies(choice.loot);
    }

    // Handle Skill Checks
    if (choice.check) {
      const { stat } = choice.check;
      // Calculate mod
      const statVal = character.stats[stat];
      const mod = Math.floor((statVal - 10) / 2);
      
      addToLog({ text: `Skill Check Required: ${choice.label}. Roll d20.`, type: 'system' });

      // Set Pending Roll
      useGameStore.setState({
          pendingRoll: {
              type: 'check',
              sides: 20,
              modifier: mod,
              label: choice.label,
              checkData: choice.check // { stat, dc, success, failure }
          }
      });
      return; // Stop here, wait for roll
    }

    if (choice.target) {
      setCurrentNode(choice.target);
    }
  };

  return { choices, handleChoice };
};

export default useNarrativeEngine;
