import { create } from 'zustand';
import itemsData from '../data/items.json';

// Flatten items data for easy lookup
export const itemLookup = {};
Object.values(itemsData).forEach(category => {
  Object.entries(category).forEach(([id, item]) => {
    itemLookup[id] = { id, ...item };
  });
});

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
  inventory: [
    { id: 'longsword', qty: 1 },
    { id: 'healing_potion', qty: 2 }
  ],
  equipment: {
    mainHand: null,
    offHand: null,
    body: null
  },
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
  
  // Combat State
  combat: {
    active: false,
    round: 0,
    turnOrder: [],
    currentTurnIndex: 0,
    victoryNode: null,
    defeatNode: null
  },

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
  },

  // Combat Actions
  startCombat: (enemies, victoryNode, defeatNode) => {
    const { character, rollDice, addToLog } = get();

    // 1. Roll Initiative for Player
    const playerInit = rollDice(20, character.initiative);
    const playerCombatant = {
      id: 'player',
      name: character.name,
      type: 'player',
      hp: character.hp.current,
      maxHp: character.hp.max,
      ac: character.ac,
      initiative: playerInit.total,
      isDead: false
    };

    addToLog({ text: `Rolled Initiative: ${playerInit.total}`, type: 'system' });

    // 2. Roll Initiative for Enemies
    const enemyCombatants = enemies.map((enemy, idx) => {
      const init = rollDice(20, enemy.initiativeBonus || 0);
      return {
        id: `enemy_${idx}`,
        ...enemy,
        initiative: init.total,
        currentHp: enemy.hp,
        maxHp: enemy.hp,
        isDead: false
      };
    });

    // 3. Sort Turn Order
    const turnOrder = [playerCombatant, ...enemyCombatants].sort((a, b) => b.initiative - a.initiative);

    set({
      gameMode: 'combat',
      combat: {
        active: true,
        round: 1,
        turnOrder,
        currentTurnIndex: 0,
        victoryNode,
        defeatNode
      }
    });

    addToLog({
      text: `Combat Started! Turn Order: ${turnOrder.map(c => c.name).join(', ')}`,
      type: 'combat'
    });

    // If first turn is enemy, trigger nextTurn logic (handled by UI or manual call? Let's check next)
    // For now, we just set state. The consumer should check whose turn it is.
  },

  nextTurn: () => {
    const { combat, addToLog, rollDice, updateCharacter, setCurrentNode, setGameMode, character } = get();
    if (!combat.active) return;

    let nextIndex = (combat.currentTurnIndex + 1) % combat.turnOrder.length;
    let round = combat.round;

    if (nextIndex === 0) {
      round++;
    }

    // Skip dead combatants
    let loopCount = 0;
    while (combat.turnOrder[nextIndex].isDead && loopCount < combat.turnOrder.length) {
      nextIndex = (nextIndex + 1) % combat.turnOrder.length;
      if (nextIndex === 0) round++;
      loopCount++;
    }

    if (loopCount >= combat.turnOrder.length) {
        // Everyone is dead? Should be handled by checkCombatStatus
        return;
    }

    set((state) => ({
      combat: {
        ...state.combat,
        currentTurnIndex: nextIndex,
        round
      }
    }));

    const currentCombatant = combat.turnOrder[nextIndex];
    addToLog({ text: `Round ${round}: It is ${currentCombatant.name}'s turn.`, type: 'system' });

    // If Enemy Turn -> AI Attack
    if (currentCombatant.type !== 'player') {
       setTimeout(() => {
         // Simple AI: Attack Player
         const attack = currentCombatant.attacks[0]; // Assume 1 attack
         const roll = rollDice(20, attack.bonus);
         const hit = roll.total >= character.ac;

         let damage = 0;
         if (hit) {
           // Parse damage string "1d6+2" -> simplistic parser
           const [dice, mod] = attack.damage.split('+');
           const [count, sides] = dice.split('d').map(Number);

           let totalDmg = Number(mod);
           for (let i = 0; i < count; i++) {
              totalDmg += rollDice(sides, 0).roll;
           }
           damage = totalDmg;

           // Update Player HP
           const newHp = Math.max(0, character.hp.current - damage);
           updateCharacter({ hp: { ...character.hp, current: newHp } });

           addToLog({
             text: `${currentCombatant.name} attacks you with ${attack.name}! Rolled ${roll.total} (vs AC ${character.ac}). HIT! You take ${damage} damage.`,
             type: 'combat'
           });

           if (newHp === 0) {
             addToLog({ text: "You have been defeated!", type: 'combat' });
             setGameMode('narrative');
             setCurrentNode(combat.defeatNode);
             set({ combat: { ...combat, active: false } });
             return;
           }

         } else {
            addToLog({
             text: `${currentCombatant.name} attacks you with ${attack.name}! Rolled ${roll.total} (vs AC ${character.ac}). MISS!`,
             type: 'combat'
           });
         }

         // End Enemy Turn
         get().nextTurn();
       }, 1000);
    }
  },

  performPlayerAttack: (targetId) => {
    const { combat, rollDice, addToLog, setGameMode, setCurrentNode } = get();
    const targetIndex = combat.turnOrder.findIndex(c => c.id === targetId);
    if (targetIndex === -1) return;

    const target = combat.turnOrder[targetIndex];
    if (target.isDead) return;

    // Hardcoded player attack for now (Fighter sword)
    // Ideally get from equipped weapon
    const attackBonus = 5;
    const roll = rollDice(20, attackBonus);
    const hit = roll.total >= target.ac;

    if (hit) {
      const damage = rollDice(8, 3).total; // 1d8+3 Longsword
      const newHp = Math.max(0, target.currentHp - damage);
      const isDead = newHp === 0;

      // Update Combat State
      const newTurnOrder = [...combat.turnOrder];
      newTurnOrder[targetIndex] = {
        ...target,
        currentHp: newHp,
        isDead
      };

      set((state) => ({
        combat: {
          ...state.combat,
          turnOrder: newTurnOrder
        }
      }));

      addToLog({
         text: `You attack ${target.name}! Rolled ${roll.total} (vs AC ${target.ac}). HIT! Dealt ${damage} damage.`,
         type: 'combat'
      });

      if (isDead) {
        addToLog({ text: `${target.name} falls!`, type: 'combat' });
      }

      // Check Victory
      const allEnemiesDead = newTurnOrder.every(c => c.type === 'player' || c.isDead);
      if (allEnemiesDead) {
         setTimeout(() => {
            addToLog({ text: "Victory!", type: 'combat' });
            setGameMode('narrative');
            setCurrentNode(combat.victoryNode);
            set({ combat: { ...combat, active: false } });
         }, 1000);
         return;
      }

    } else {
      addToLog({
         text: `You attack ${target.name}! Rolled ${roll.total} (vs AC ${target.ac}). MISS!`,
         type: 'combat'
      });
    }

    get().nextTurn();
  }
}));

export default useGameStore;
