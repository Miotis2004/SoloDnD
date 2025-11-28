import { create } from 'zustand';

// Initial state for a fresh character
const initialCharacter = {
  name: "Hero",
  race: "Human",
  class: "Fighter",
  level: 1,
  hp: { current: 12, max: 12 },
  ac: 16,
  initiative: 0,
  speed: 30,
  proficiencyBonus: 2,
  stats: {
    str: 16,
    dex: 14,
    con: 14,
    int: 10,
    wis: 12,
    cha: 10
  },
  skills: [],
  inventory: [],
  spells: []
};

const useGameStore = create((set) => ({
  character: initialCharacter,
  
  // Game Mode: 'narrative' or 'combat'
  gameMode: 'narrative',
  
  // Adventure State
  currentAdventureId: 'demo-adventure',
  currentNodeId: 'intro',
  log: [{ id: 1, text: "Welcome to the adventure...", type: 'narrative' }],
  
  // Actions
  setGameMode: (mode) => set({ gameMode: mode }),
  
  updateCharacter: (updates) => set((state) => ({ 
    character: { ...state.character, ...updates } 
  })),
  
  addToLog: (entry) => set((state) => ({ 
    log: [...state.log, { id: Date.now(), ...entry }] 
  })),
  
  setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),
  
  // Simple Dice Roller
  rollDice: (sides, modifier = 0) => {
    const roll = Math.floor(Math.random() * sides) + 1;
    const total = roll + modifier;
    return { roll, total };
  }
}));

export default useGameStore;
