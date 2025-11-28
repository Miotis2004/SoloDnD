import React, { useEffect, useState } from 'react';
import useGameStore from '../store/useGameStore';
import adventureData from '../data/adventure.json';

// This component doesn't render UI, it manages the logic bridge between the Store and the JSON
const useNarrativeEngine = () => {
  const { 
    currentNodeId, 
    setCurrentNode, 
    addToLog, 
    setGameMode, 
    character, 
    rollDice 
  } = useGameStore();
  
  const [choices, setChoices] = useState([]);

  useEffect(() => {
    // 1. Load current node
    const node = adventureData.nodes[currentNodeId];
    if (!node) {
      console.error("Node not found:", currentNodeId);
      return;
    }

    // 2. Add text to log (avoid duplicates if possible, but for now simple append)
    // In a real app we'd track 'visited' to not re-log on re-renders, 
    // but here we trust the state change triggers this effect once.
    addToLog({ 
      text: node.text, 
      type: node.type || 'narrative',
      title: node.type === 'combat' ? 'Combat Encounter' : null
    });

    // 3. Handle Node Type
    if (node.type === 'combat') {
      setGameMode('combat');
      // In a full implementation, we'd spawn enemies here
    } else {
      setGameMode('narrative');
    }

    // 4. Set Choices
    setChoices(node.choices || []);

  }, [currentNodeId]);

  const handleChoice = (choice) => {
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
