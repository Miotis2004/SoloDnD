import { create } from 'zustand';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
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
  id: null, // assigned on creation
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
  characterList: [], // List of all characters for the user
  
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

  // Pending Roll State
  pendingRoll: null, // { type: 'initiative'|'attack'|'damage'|'check', sides: 20, modifier: 0, targetId: null, label: '...' }

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

    // 1. Roll Initiative for Enemies (Auto)
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

    // 2. Set Up Combat State with temporary turn order (waiting for player)
    set({
      gameMode: 'combat',
      combat: {
        active: true,
        round: 1,
        turnOrder: enemyCombatants, // Will add player after roll
        currentTurnIndex: 0,
        victoryNode,
        defeatNode
      },
      pendingRoll: {
        type: 'initiative',
        sides: 20,
        modifier: character.initiative,
        label: "Roll for Initiative!"
      }
    });

    addToLog({ text: "Combat Started! Roll Initiative!", type: 'combat' });
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
         // Data structure: { attack: "+4", damage: "1d6+2", ... }
         const attackBonus = parseInt(currentCombatant.attack) || 0;
         const roll = rollDice(20, attackBonus);
         const hit = roll.total >= character.ac;

         let damage = 0;
         if (hit) {
           // Parse damage string "1d6+2" -> simplistic parser
           const [dice, mod] = currentCombatant.damage.split('+');
           const [count, sides] = dice.split('d').map(Number);

           // Handle cases where mod might be missing or empty
           let totalDmg = mod ? parseInt(mod) : 0;

           for (let i = 0; i < count; i++) {
              totalDmg += rollDice(sides, 0).roll;
           }
           damage = totalDmg;

           // Update Player HP
           const newHp = Math.max(0, character.hp.current - damage);
           updateCharacter({ hp: { ...character.hp, current: newHp } });

           addToLog({
             text: `${currentCombatant.name} attacks you! Rolled ${roll.total} (vs AC ${character.ac}). HIT! You take ${damage} damage.`,
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
             text: `${currentCombatant.name} attacks you! Rolled ${roll.total} (vs AC ${character.ac}). MISS!`,
             type: 'combat'
           });
         }

         // End Enemy Turn
         get().nextTurn();
       }, 2500); // Slower pacing for better UX
    } else {
        // Player's Turn
        addToLog({ text: "It's your turn! Select an action.", type: 'combat' });
    }
  },

  initiatePlayerAttack: (targetId) => {
    const { combat, character, addToLog } = get();
    const targetIndex = combat.turnOrder.findIndex(c => c.id === targetId);
    if (targetIndex === -1) return;

    // Stats calc (Simplified)
    const strMod = Math.floor((character.stats.str - 10) / 2);
    const attackBonus = character.proficiencyBonus + strMod;

    addToLog({ text: `Attacking target... Please roll d20 to hit.`, type: 'system' });

    set({
        pendingRoll: {
            type: 'attack',
            sides: 20,
            modifier: attackBonus,
            targetId: targetId,
            label: 'Attack Roll'
        }
    });
  },

  resolveDiceRoll: (sides, resultValue) => {
      const { pendingRoll, character, combat, rollDice, addToLog, setGameMode, setCurrentNode } = get();
      if (!pendingRoll) return;

      const total = resultValue + pendingRoll.modifier;

      // --- INITIATIVE ---
      if (pendingRoll.type === 'initiative') {
          const playerCombatant = {
            id: 'player',
            name: character.name,
            type: 'player',
            hp: character.hp.current,
            maxHp: character.hp.max,
            ac: character.ac,
            initiative: total,
            isDead: false
          };

          addToLog({ text: `Rolled Initiative: ${total}`, type: 'system' });

          const newTurnOrder = [playerCombatant, ...combat.turnOrder].sort((a, b) => b.initiative - a.initiative);

          set({
              combat: { ...combat, turnOrder: newTurnOrder, currentTurnIndex: 0 },
              pendingRoll: null
          });

          // Check if it's already someone else's turn (if player is not first)
          if (newTurnOrder[0].id !== 'player') {
             // Trigger nextTurn immediately to start AI or waiting
             setTimeout(() => get().nextTurn(), 500);
          } else {
             addToLog({ text: `It is your turn!`, type: 'combat' });
          }
      }

      // --- ATTACK ROLL ---
      else if (pendingRoll.type === 'attack') {
         const targetId = pendingRoll.targetId;
         const target = combat.turnOrder.find(c => c.id === targetId);

         if (!target) {
            set({ pendingRoll: null });
            get().nextTurn();
            return;
         }

         const hit = total >= target.ac;
         if (hit) {
             // Setup Damage Roll
            const weaponId = character.equipment.mainHand;
            const weapon = weaponId ? itemLookup[weaponId] : null;

            let damageDice = "1";
            let damageSides = 4; // Unarmed
            if (weapon && weapon.damage) {
                const parts = weapon.damage.split('d');
                damageDice = parts[0];
                damageSides = parseInt(parts[1]);
            }
            // Note: Simplistic, assuming 1 die for pending roll. If multiple dice (2d6), we might need a loop or multi-click.
            // For this version, let's assume we roll one die type and multiply or sum logic is internal?
            // "6. User clicks [Weapon Die]." -> Implies single click.
            // We will just ask for the die type. If it's 2d6, we will roll 2d6 internally on that one click for simplicity of UI?
            // Or better: The prompt says "Roll d6 for damage". The result `resolveDiceRoll` receives is just ONE roll.
            // If weapon is 2d6, we need to roll the other dice automatically?
            // Let's keep it simple: We ask for the die sides. If it's 2d6, we treat the user input as the first die, and auto-roll the rest.

            const numDice = parseInt(damageDice) || 1;
            const strMod = Math.floor((character.stats.str - 10) / 2);

            addToLog({ text: `Rolled ${total} (vs AC ${target.ac}). HIT! Roll d${damageSides} for damage.`, type: 'combat' });

            set({
                pendingRoll: {
                    type: 'damage',
                    sides: damageSides,
                    modifier: strMod, // Add Str to dmg
                    targetId: targetId,
                    multiplier: numDice, // Store how many dice
                    label: 'Damage Roll'
                }
            });

         } else {
             addToLog({ text: `Rolled ${total} (vs AC ${target.ac}). MISS!`, type: 'combat' });
             set({ pendingRoll: null });
             get().nextTurn();
         }
      }

      // --- DAMAGE ROLL ---
      else if (pendingRoll.type === 'damage') {
          const targetId = pendingRoll.targetId;
          const targetIndex = combat.turnOrder.findIndex(c => c.id === targetId);
          if (targetIndex === -1) {
             set({ pendingRoll: null });
             get().nextTurn();
             return;
          }

          // Calculate total damage
          // The 'resultValue' is the first die.
          let damageTotal = resultValue;

          // Roll remaining dice if any
          if (pendingRoll.multiplier > 1) {
              for(let i=1; i < pendingRoll.multiplier; i++) {
                  damageTotal += rollDice(pendingRoll.sides).roll;
              }
          }

          damageTotal += pendingRoll.modifier;

          const target = combat.turnOrder[targetIndex];
          const newHp = Math.max(0, target.currentHp - damageTotal);
          const isDead = newHp === 0;

          const newTurnOrder = [...combat.turnOrder];
          newTurnOrder[targetIndex] = { ...target, currentHp: newHp, isDead };

          addToLog({ text: `Dealt ${damageTotal} damage to ${target.name}.`, type: 'combat' });
          if (isDead) {
              addToLog({ text: `${target.name} falls!`, type: 'combat' });
          }

          set({
              combat: { ...combat, turnOrder: newTurnOrder },
              pendingRoll: null
          });

          // Check Victory
          const allEnemiesDead = newTurnOrder.every(c => c.type === 'player' || c.isDead);
          if (allEnemiesDead) {
             setTimeout(() => {
                addToLog({ text: "Victory!", type: 'combat' });
                const victoryNode = combat.victoryNode;
                setGameMode('narrative');
                setCurrentNode(victoryNode);
                set({ combat: { ...combat, active: false } });
             }, 1000);
          } else {
             get().nextTurn();
          }
      }

      // --- SKILL CHECK ---
      else if (pendingRoll.type === 'check') {
          const { dc, success, failure, label } = pendingRoll.checkData;
          const passed = total >= dc;

          addToLog({
             text: `Check ${label}: Rolled ${total} (vs DC ${dc}). ${passed ? "Success!" : "Failure!"}`,
             type: 'system'
          });

          set({ pendingRoll: null });
          setCurrentNode(passed ? success : failure);
      }
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

      // Ensure character has an ID
      if (!character.id) {
          console.error("Cannot save character without ID");
          return;
      }

      const saveData = {
          character,
          log,
          currentNodeId,
          currentAdventureId,
          gameMode,
          combat,
          lastSaved: new Date().toISOString()
      };

      try {
        if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
             console.warn("Mock Save Game:", saveData);
             const saves = JSON.parse(localStorage.getItem(`saves_${uid}`) || "{}");
             saves[character.id] = saveData;
             localStorage.setItem(`saves_${uid}`, JSON.stringify(saves));
             get().addToLog({ text: "Game Saved (Local Mock).", type: 'system' });
             return;
        }

        await setDoc(doc(db, "users", uid, "characters", character.id), saveData);
        get().addToLog({ text: "Game Saved to Cloud.", type: 'system' });
      } catch (error) {
        console.error("Save failed", error);
        get().addToLog({ text: "Save Failed.", type: 'system' });
      }
  },

  loadCharacterList: async (uid) => {
      try {
        if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
             const saves = JSON.parse(localStorage.getItem(`saves_${uid}`) || "{}");
             const list = Object.values(saves).map(s => s.character);
             set({ characterList: list });
             return list;
        }

        const querySnapshot = await getDocs(collection(db, "users", uid, "characters"));
        const list = [];
        querySnapshot.forEach((doc) => {
            list.push(doc.data().character);
        });
        set({ characterList: list });
        return list;
      } catch (error) {
          console.error("Failed to load character list", error);
          return [];
      }
  },

  loadGame: async (uid, characterId) => {
      try {
        let data = null;
        if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
             const saves = JSON.parse(localStorage.getItem(`saves_${uid}`) || "{}");
             data = saves[characterId];
        } else {
             const docSnap = await getDoc(doc(db, "users", uid, "characters", characterId));
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
            get().addToLog({ text: "Character Loaded.", type: 'system' });
        } else {
             console.error("Save file not found for", characterId);
        }
      } catch (error) {
          console.error("Load failed", error);
      }
  },

  createNewCharacter: async (uid, newCharacterData) => {
      const { saveGame } = get();
      const newId = `char_${Date.now()}`;

      const newCharacter = {
          ...initialCharacter,
          ...newCharacterData,
          id: newId,
          hp: { current: newCharacterData.maxHp, max: newCharacterData.maxHp }
      };

      // Reset Game State for new character
      set({
          character: newCharacter,
          log: [{ id: 1, text: "Your adventure begins...", type: 'narrative' }],
          currentNodeId: 'intro',
          gameMode: 'narrative',
          combat: { active: false, round: 0, turnOrder: [], currentTurnIndex: 0, victoryNode: null, defeatNode: null }
      });

      // Initial Save
      await saveGame(uid);

      // Refresh list
      await get().loadCharacterList(uid);
  }
}));

export default useGameStore;
