import React, { useEffect } from 'react';
import useGameStore from '../store/useGameStore';
import adventureData from '../data/adventure.json';
import monsterData from '../data/monsters.json';

// This component doesn't render UI, it manages the logic bridge between the Store and the JSON
const useNarrativeEngine = () => {
  const { 
    currentNodeId, 
    setCurrentNode, 
    addToLog, 
    setGameMode, 
    character, 
    rollDice,
    startCombat
  } = useGameStore();
  
  // Derive choices directly from the current node ID and data
  const node = adventureData.nodes[currentNodeId];
  const choices = node?.choices || [];

  // Flatten monster data for easier lookup
  const allMonsters = React.useMemo(() => {
    return Object.values(monsterData).reduce((acc, cat) => ({...acc, ...cat}), {});
  }, []);

  useEffect(() => {
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
      const enemies = (node.enemies || []).map(id => allMonsters[id]).filter(Boolean);

      if (enemies.length > 0) {
        startCombat(enemies, node.on_victory, node.on_defeat);
      } else {
        console.error("No valid enemies found for combat node", node.enemies);
        setGameMode('narrative'); // Fallback
      }
    } else {
      setGameMode('narrative');
    }

  }, [currentNodeId, addToLog, setGameMode, node, startCombat, allMonsters]);

  const handleChoice = (choice) => {
    // Special Actions defined in Adventure JSON
    if (choice.action === 'loot') {
        useGameStore.getState().lootBodies(choice.loot);
    }

    // Handle Skill Checks
    if (choice.check) {
      const { stat, dc, success, failure } = choice.check;
      // Calculate mod
      const statVal = character.stats[stat];
      const mod = Math.floor((statVal - 10) / 2);
      
      const { roll, total } = rollDice(20, mod);
      const passed = total >= dc;

      addToLog({ 
        text: `Attempted ${choice.label}. Rolled ${roll} + ${mod} = ${total} (DC ${dc}). ${passed ? "Success!" : "Failure!"}`,
        type: 'system'
      });

      setCurrentNode(passed ? success : failure);
    } else if (choice.target) {
      setCurrentNode(choice.target);
    }
  };

  return { choices, handleChoice };
};

export default useNarrativeEngine;
