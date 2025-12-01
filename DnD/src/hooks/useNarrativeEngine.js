import React, { useEffect } from 'react';
import useGameStore, { monsterLookup } from '../store/useGameStore';
import defaultAdventureData from '../data/adventure.json';

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

  // Use active adventure if loaded, else fallback to default
  const adventureData = activeAdventure || defaultAdventureData;

  // Derive choices directly from the current node ID and data
  const node = adventureData?.nodes ? adventureData.nodes[currentNodeId] : null;
  const choices = node?.choices || [];

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
      const enemies = (node.enemies || [])
        .map((enemy) => (typeof enemy === 'string' ? monsterLookup[enemy] : enemy))
        .filter(Boolean);

      if (enemies.length > 0) {
        startCombat(enemies, node.on_victory, node.on_defeat);
      } else {
        console.error("No valid enemies found for combat node", node.enemies);
        setGameMode('narrative'); // Fallback
      }
    } else {
      setGameMode('narrative');
    }

  }, [currentNodeId, addToLog, setGameMode, node, startCombat]);

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
