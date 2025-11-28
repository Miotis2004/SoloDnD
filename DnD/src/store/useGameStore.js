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

const useGameStore = create((set, get) => ({
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

  // Helper to trigger AI if it's their turn
  triggerAiTurn: () => {
    const { combat, character, rollDice, addToLog, updateCharacter, setGameMode, setCurrentNode } = get();
    if (!combat.active) return;

    const currentCombatant = combat.turnOrder[combat.currentTurnIndex];
    if (!currentCombatant || currentCombatant.type === 'player' || currentCombatant.isDead) return;

    // addToLog({ text: `${currentCombatant.name} is preparing to act...`, type: 'system' });

    setTimeout(() => {
         // Re-check state in case it changed during timeout
         const { combat: currentCombat } = get();
         if (!currentCombat.active) return;

         // AI Logic
         const attackBonus = parseInt(currentCombatant.attack) || 0;
         const roll = rollDice(20, attackBonus);
         const hit = roll.total >= character.ac;

         if (hit) {
           const damageStr = currentCombatant.damage || "1";
           let totalDmg = 0;

           if (damageStr.includes('d')) {
             const parts = damageStr.split('+');
             const dicePart = parts[0];
             const modPart = parts[1] || "0";

             const [count, sides] = dicePart.split('d').map(Number);
             let diceTotal = 0;
             for (let i = 0; i < count; i++) {
                diceTotal += rollDice(sides, 0).roll;
             }
             totalDmg = diceTotal + Number(modPart);
           } else {
             totalDmg = Number(damageStr);
           }

           // Update Player HP
           const newHp = Math.max(0, character.hp.current - totalDmg);
           updateCharacter({ hp: { ...character.hp, current: newHp } });

           addToLog({
             text: `${currentCombatant.name} attacks you! Rolled ${roll.total} (vs AC ${character.ac}). HIT! You take ${totalDmg} damage.`,
             type: 'combat'
           });

           if (newHp === 0) {
             addToLog({ text: "You have been defeated!", type: 'combat' });
             setGameMode('narrative');
             setCurrentNode(currentCombat.defeatNode);
             set({ combat: { ...currentCombat, active: false } });
             return;
           }
         } else {
            addToLog({
             text: `${currentCombatant.name} attacks you! Rolled ${roll.total} (vs AC ${character.ac}). MISS!`,
             type: 'combat'
           });
         }

         // End Enemy Turn
         get().nextTurn();
    }, 1000);
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
      const init = rollDice(20, 0);
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

    // If first turn is enemy, trigger AI logic
    get().triggerAiTurn();
  },

  nextTurn: () => {
    const { combat, addToLog } = get();
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
        // Everyone is dead?
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

    // Trigger AI if needed
    get().triggerAiTurn();
  },

  performPlayerAttack: (targetId) => {
    const { combat, rollDice, addToLog, setGameMode, setCurrentNode } = get();
    const targetIndex = combat.turnOrder.findIndex(c => c.id === targetId);
    if (targetIndex === -1) return;

    const target = combat.turnOrder[targetIndex];
    if (target.isDead) return;

    // Hardcoded player attack for now (Fighter sword)
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
