import { create } from 'zustand';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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

  equipItem: (itemId) => {
    const { character, addToLog } = get();
    const item = itemLookup[itemId];
    if (!item) return;

    // Determine slot
    const slot = item.slot;
    // If it's a weapon without specific slot, default to mainHand
    const targetSlot = slot || 'mainHand';

    // Check if already equipped
    if (character.equipment[targetSlot] === itemId) {
        // Unequip
        set((state) => ({
            character: {
                ...state.character,
                equipment: { ...state.character.equipment, [targetSlot]: null }
            }
        }));
        addToLog({ text: `Unequipped ${item.name}.`, type: 'system' });
    } else {
        // Equip (swap if needed)
        const oldItem = character.equipment[targetSlot];

        set((state) => ({
            character: {
                ...state.character,
                equipment: { ...state.character.equipment, [targetSlot]: itemId }
            }
        }));

        if (oldItem) {
             addToLog({ text: `Unequipped ${itemLookup[oldItem]?.name || oldItem} and equipped ${item.name}.`, type: 'system' });
        } else {
             addToLog({ text: `Equipped ${item.name}.`, type: 'system' });
        }
    }
  },

  useItem: (itemId) => {
    const { character, updateCharacter, addToLog } = get();
    const invItemIndex = character.inventory.findIndex(i => i.id === itemId);
    if (invItemIndex === -1) return;

    const invItem = character.inventory[invItemIndex];
    if (invItem.qty <= 0) return;

    const item = itemLookup[itemId];
    if (!item) return;

    // Apply Effects
    if (item.effect === 'heal') {
        // Simplistic parsing for healing value, usually "2d4+2" -> lets just take the flat value or max for demo
        // Or implement dice parser. item.value is usually gold value.
        // Let's hardcode healing based on ID for simplicity or parse description?
        // Actually, let's use the 'rollDice' logic if we can parse it, or just a fixed amount

        let healAmount = 5; // Default
        if (itemId === 'healing_potion') healAmount = 7; // 2d4+2 avg
        if (itemId === 'greater_healing_potion') healAmount = 14;

        const newHp = Math.min(character.hp.max, character.hp.current + healAmount);
        const healed = newHp - character.hp.current;

        updateCharacter({ hp: { ...character.hp, current: newHp } });
        addToLog({ text: `Used ${item.name}. Healed for ${healed} HP.`, type: 'system' });
    } else {
        addToLog({ text: `Used ${item.name}.`, type: 'system' });
    }

    // Decrement Quantity
    const newInventory = [...character.inventory];
    newInventory[invItemIndex] = { ...invItem, qty: invItem.qty - 1 };

    // Remove if 0? Or keep as 0? Usually remove.
    if (newInventory[invItemIndex].qty <= 0) {
        newInventory.splice(invItemIndex, 1);
    }

    set((state) => ({
        character: { ...state.character, inventory: newInventory }
    }));
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
    const { combat, rollDice, addToLog, setGameMode, setCurrentNode, character } = get();
    const targetIndex = combat.turnOrder.findIndex(c => c.id === targetId);
    if (targetIndex === -1) return;

    const target = combat.turnOrder[targetIndex];
    if (target.isDead) return;

    // Determine Weapon
    const weaponId = character.equipment.mainHand;
    const weapon = weaponId ? itemLookup[weaponId] : null;
    const weaponName = weapon ? weapon.name : "Unarmed Strike";

    // Stats calc (Simplified)
    const strMod = Math.floor((character.stats.str - 10) / 2);
    const attackBonus = character.proficiencyBonus + strMod;

    const roll = rollDice(20, attackBonus);
    const hit = roll.total >= target.ac;

    if (hit) {
      // Parse Damage: "1d8" or "1d6" etc.
      let damageDice = "1"; // Unarmed default
      let damageSides = 4;

      if (weapon && weapon.damage) {
         const parts = weapon.damage.split('d');
         damageDice = parts[0];
         damageSides = parseInt(parts[1]);
      }

      const numDice = parseInt(damageDice) || 1;
      let damageTotal = strMod; // Add Strength mod to damage

      for (let i = 0; i < numDice; i++) {
         damageTotal += rollDice(damageSides).roll;
      }

      const newHp = Math.max(0, target.currentHp - damageTotal);
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
         text: `You attack ${target.name} with ${weaponName}! Rolled ${roll.total} (vs AC ${target.ac}). HIT! Dealt ${damageTotal} damage.`,
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
            // Look for victory hook (looting etc)
            const victoryNode = combat.victoryNode;

            // If the victory node allows looting, maybe we trigger it here?
            // For now, standard transition.
            setGameMode('narrative');
            setCurrentNode(victoryNode);
            set({ combat: { ...combat, active: false } });
         }, 1000);
         return;
      }

    } else {
      addToLog({
         text: `You attack ${target.name} with ${weaponName}! Rolled ${roll.total} (vs AC ${target.ac}). MISS!`,
         type: 'combat'
      });
    }

    get().nextTurn();
  },

  castSpell: (targetId) => {
      const { addToLog } = get();
      // Placeholder
      addToLog({ text: `You chant words of power at ${targetId || 'the darkness'}... but nothing happens yet (Spell system pending).`, type: 'combat' });
      get().nextTurn();
  },

  lootBodies: (lootTable = []) => {
    const { character, addToLog } = get();
    // Default Loot if none provided
    const items = lootTable.length > 0 ? lootTable : [
        { id: 'healing_potion', qty: 1 },
        { id: 'gold', qty: 10 } // We don't track gold yet, but let's assume valid ID or ignore
    ];

    const newInventory = [...character.inventory];

    items.forEach(newItem => {
        // Check if item is valid in our DB (optional, but good safety)
        if (!itemLookup[newItem.id] && newItem.id !== 'gold') return;

        const existingIdx = newInventory.findIndex(i => i.id === newItem.id);
        if (existingIdx > -1) {
            newInventory[existingIdx] = {
                ...newInventory[existingIdx],
                qty: newInventory[existingIdx].qty + newItem.qty
            };
        } else {
            newInventory.push(newItem);
        }

        const itemName = itemLookup[newItem.id]?.name || newItem.id;
        addToLog({ text: `Looted ${newItem.qty}x ${itemName}`, type: 'system' });
    });

    set((state) => ({
        character: { ...state.character, inventory: newInventory }
    }));
  },

  saveGame: async (uid) => {
      const { character, log, currentNodeId, currentAdventureId, gameMode, combat } = get();
      const saveData = {
          character,
          log,
          currentNodeId,
          currentAdventureId,
          gameMode,
          combat, // Might be complex if active, but serializable
          lastSaved: new Date().toISOString()
      };

      try {
        if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
             console.warn("Mock Save Game:", saveData);
             localStorage.setItem(`save_${uid}`, JSON.stringify(saveData));
             get().addToLog({ text: "Game Saved (Local Mock).", type: 'system' });
             return;
        }

        await setDoc(doc(db, "saves", uid), saveData);
        get().addToLog({ text: "Game Saved to Cloud.", type: 'system' });
      } catch (error) {
        console.error("Save failed", error);
        get().addToLog({ text: "Save Failed.", type: 'system' });
      }
  },

  loadGame: async (uid) => {
      try {
        let data = null;
        if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
             const local = localStorage.getItem(`save_${uid}`);
             if (local) data = JSON.parse(local);
        } else {
             const docSnap = await getDoc(doc(db, "saves", uid));
             if (docSnap.exists()) {
                 data = docSnap.data();
             }
        }

        if (data) {
            set({
                character: data.character,
                log: data.log,
                currentNodeId: data.currentNodeId,
                currentAdventureId: data.currentAdventureId,
                gameMode: data.gameMode,
                combat: data.combat
            });
            get().addToLog({ text: "Game Loaded.", type: 'system' });
        } else {
             // New Game or No Save found
             get().addToLog({ text: "New Journey Started.", type: 'system' });
        }
      } catch (error) {
          console.error("Load failed", error);
      }
  }
}));

export default useGameStore;
