import { create } from 'zustand';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { hydrateLookups, itemLookup, spellLookup } from './contentLookups';

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
  
  // Content Cache
  contentLoaded: false,

  // Game Mode: 'narrative' or 'combat'
  gameMode: 'narrative',
  
  // Adventure State
  currentCampaignId: null,
  currentAdventureId: 'demo-adventure',
  activeAdventure: null, // Full data of the running adventure
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
  initializeContent: async () => {
      const { contentLoaded } = get();
      if (contentLoaded) return;

      try {
          if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
              set({ contentLoaded: true });
              return;
          }

          // Fetch Items
          const itemSnap = await getDocs(collection(db, 'content_items'));
          const spellSnap = await getDocs(collection(db, 'content_spells'));
          const monsterSnap = await getDocs(collection(db, 'content_monsters'));

          const newItems = {};
          const newSpells = {};
          const newMonsters = {};

          itemSnap.forEach(doc => { newItems[doc.id] = { id: doc.id, ...doc.data() }; });
          spellSnap.forEach(doc => { newSpells[doc.id] = { id: doc.id, ...doc.data() }; });
          monsterSnap.forEach(doc => { newMonsters[doc.id] = { id: doc.id, ...doc.data() }; });

          hydrateLookups({ items: newItems, spells: newSpells, monsters: newMonsters });

          set({ contentLoaded: true });
          console.log("Content initialized from Firestore.");
      } catch (e) {
          console.error("Failed to init content:", e);
      }
  },

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
            // Setup Damage Roll (Weapon OR Spell)
            let damageDice = "1";
            let damageSides = 4; // Unarmed default
            let dmgMod = Math.floor((character.stats.str - 10) / 2); // Default Str mod

            // Check if this was a Spell Attack
            if (pendingRoll.spellId) {
                const spell = spellLookup[pendingRoll.spellId];
                if (spell && spell.damage) {
                    const parts = spell.damage.split('d');
                    damageDice = parts[0];
                    damageSides = parseInt(parts[1]);
                    dmgMod = 0; // Spells usually don't add mod to damage unless specified (e.g. Eldritch Blast Agonizing, but simple for now)
                }
            } else {
                // Weapon Attack
                const weaponId = character.equipment.mainHand;
                const weapon = weaponId ? itemLookup[weaponId] : null;
                if (weapon && weapon.damage) {
                    const parts = weapon.damage.split('d');
                    damageDice = parts[0];
                    damageSides = parseInt(parts[1]);
                }
            }

            const numDice = parseInt(damageDice) || 1;

            addToLog({ text: `Rolled ${total} (vs AC ${target.ac}). HIT! Roll d${damageSides} for damage.`, type: 'combat' });

            set({
                pendingRoll: {
                    type: 'damage',
                    sides: damageSides,
                    modifier: dmgMod,
                    targetId: targetId,
                    multiplier: numDice,
                    label: 'Damage Roll'
                }
            });

         } else {
             addToLog({ text: `Rolled ${total} (vs AC ${target.ac}). MISS!`, type: 'combat' });
             set({ pendingRoll: null });
             get().nextTurn();
         }
      }

      // --- DAMAGE (OR HEAL) ROLL ---
      else if (pendingRoll.type === 'damage' || pendingRoll.type === 'heal') {
          const isHeal = pendingRoll.type === 'heal';
          const targetId = pendingRoll.targetId;

          // Calculate total
          let totalValue = resultValue;
          if (pendingRoll.multiplier > 1) {
              for(let i=1; i < pendingRoll.multiplier; i++) {
                  totalValue += rollDice(pendingRoll.sides).roll;
              }
          }
          totalValue += pendingRoll.modifier;

          if (isHeal) {
              // Apply Healing to Player
              // (Simplification: assuming target is always player for heal spells in this MVP)
              const newHp = Math.min(character.hp.max, character.hp.current + totalValue);
              set((state) => ({
                character: { ...state.character, hp: { ...state.character.hp, current: newHp } }
              }));
              addToLog({ text: `Healed for ${totalValue} HP.`, type: 'system' });

              set({ pendingRoll: null });
              get().nextTurn();
              return;
          }

          // Apply Damage to Enemy
          const targetIndex = combat.turnOrder.findIndex(c => c.id === targetId);
          if (targetIndex === -1) {
             set({ pendingRoll: null });
             get().nextTurn();
             return;
          }

          const target = combat.turnOrder[targetIndex];
          const newHp = Math.max(0, target.currentHp - totalValue);
          const isDead = newHp === 0;

          const newTurnOrder = [...combat.turnOrder];
          newTurnOrder[targetIndex] = { ...target, currentHp: newHp, isDead };

          addToLog({ text: `Dealt ${totalValue} damage to ${target.name}.`, type: 'combat' });
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

  castSpell: (targetId, spellId) => {
      const { addToLog, character, updateCharacter } = get();
      const spell = spellLookup[spellId];
      if (!spell) return;

      // 1. Check Slots
      const level = spell.level;
      if (level > 0) {
          const slots = character.spellSlots?.[level] || 0;
          if (slots <= 0) {
              addToLog({ text: `Not enough level ${level} spell slots!`, type: 'system' });
              return;
          }
          // Consume Slot
          const newSlots = { ...character.spellSlots, [level]: slots - 1 };
          updateCharacter({ spellSlots: newSlots });
          addToLog({ text: `Cast ${spell.name}. (${slots-1} slots remaining)`, type: 'combat' });
      } else {
          addToLog({ text: `Cast ${spell.name} (Cantrip).`, type: 'combat' });
      }

      // 2. Handle Effect Types
      if (spell.attackType === 'attack') {
          // Attack Roll required
          // Better: Derive from class casting stat.
          // For MVP, lets use Proficiency + 2 (approx +4) or just character.proficiencyBonus + MAX(INT, WIS, CHA mod)
          const stats = character.stats;
          const castStat = Math.max(stats.int, stats.wis, stats.cha);
          const castMod = Math.floor((castStat - 10) / 2);
          const attackBonus = character.proficiencyBonus + castMod;

          addToLog({ text: `Spell Attack! Roll d20.`, type: 'system' });
          set({
            pendingRoll: {
                type: 'attack',
                sides: 20,
                modifier: attackBonus,
                targetId: targetId,
                label: `Attack with ${spell.name}`,
                spellId: spellId // Pass spell ID to resolve logic
            }
          });

      } else if (spell.attackType === 'save') {
          // Enemy makes save. For interactive feel, we can just say "Target resists DC X..."
          // Or we prompt user to roll damage if we assume fail?
          // Let's auto-resolve save for enemies to keep flow fast, then prompt damage if fail.
          const stats = character.stats;
          const castStat = Math.max(stats.int, stats.wis, stats.cha);
          const castMod = Math.floor((castStat - 10) / 2);
          const dc = 8 + character.proficiencyBonus + castMod;

          const target = get().combat.turnOrder.find(c => c.id === targetId);
          if (target) {
             // Simulate save: d20 + 0 (simplification for MVP monster stats)
             // Monsters usually have stats... `monsters.json` has `dex`, `con`, etc.
             // Let's try to look up monster stat?
             const saveStat = spell.savingThrow || 'dex'; // 'dex', 'con', etc.
             const monsterStat = target[saveStat] || 10;
             const monsterMod = Math.floor((monsterStat - 10) / 2);

             const { total } = get().rollDice(20, monsterMod);
             const saved = total >= dc;

             if (saved) {
                 addToLog({ text: `${target.name} resists ${spell.name}! (Rolled ${total} vs DC ${dc}) - Half Damage (Not impl, taking 0 for MVP clarity).`, type: 'combat' });
                 get().nextTurn();
             } else {
                 addToLog({ text: `${target.name} failed save! (Rolled ${total} vs DC ${dc}). Roll Damage!`, type: 'combat' });
                 // Trigger Damage Roll
                 // Parse dice: "3d6"
                 let damageDice = "1";
                 let damageSides = 6;
                 if (spell.damage) {
                    const parts = spell.damage.split('d');
                    damageDice = parts[0];
                    damageSides = parseInt(parts[1]);
                 }
                 set({
                    pendingRoll: {
                        type: 'damage',
                        sides: damageSides,
                        modifier: 0,
                        targetId: targetId,
                        multiplier: parseInt(damageDice) || 1,
                        label: `${spell.name} Damage`
                    }
                });
             }
          } else {
              get().nextTurn();
          }

      } else if (spell.attackType === 'heal') {
          // Roll healing
          let healDice = "1";
          let healSides = 8;
          let healMod = 0;
          // e.g. "1d8"
          if (spell.healing) {
             const parts = spell.healing.split('d'); // "1d8" -> ["1", "8"] (ignoring +mod for now in string parse)
             healDice = parts[0];
             healSides = parseInt(parts[1]);
             // If complex string "1d8+3", we need better parser.
             // Simplification: just base dice for MVP or simple mod.
          }

          addToLog({ text: `Healing! Roll d${healSides}.`, type: 'system' });
          set({
            pendingRoll: {
                type: 'heal',
                sides: healSides,
                modifier: healMod,
                targetId: 'player', // Force player for now
                multiplier: parseInt(healDice) || 1,
                label: `Heal with ${spell.name}`
            }
          });

      } else if (spell.attackType === 'buff' || spell.attackType === 'utility') {
          addToLog({ text: `Effect applied: ${spell.description} (Mechanic not fully implemented)`, type: 'combat' });
          get().nextTurn();
      }
  },

  performLongRest: () => {
      const { character, addToLog, updateCharacter } = get();
      // Restore HP
      const newHp = { ...character.hp, current: character.hp.max };

      // Restore Spell Slots (Reset to class max)
      // This requires knowing max slots per level.
      // For MVP, we can look at `CharacterCreator.jsx` logic or just assume full restore of *current structure*?
      // Issue: `character.spellSlots` stores current. We lost "Max" info.
      // Fix: We should store `maxSpellSlots` in character or look it up.
      // For now, let's hardcode reset for known classes or just not reset slots (user only asked for "restore spell slots").
      // Better approach: We need to know what the max is.
      // Let's modify `character` to store `maxSpellSlots` on creation.
      // I'll update `CharacterCreator` in a moment, but here I will use `character.maxSpellSlots` if it exists.

      let newSlots = character.spellSlots;
      if (character.maxSpellSlots) {
          newSlots = { ...character.maxSpellSlots };
      }

      updateCharacter({ hp: newHp, spellSlots: newSlots });
      addToLog({ text: "Long Rest taken. HP and Spell Slots restored.", type: 'system' });
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
      const { character, log, currentNodeId, currentAdventureId, currentCampaignId, gameMode, combat } = get();

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
          currentCampaignId,
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
            const data = doc.data();
            // Handle both nested 'character' structure (new save) and flat structure (old/migrated save)
            // AND fallback to empty object if undefined to prevent UI crashes
            let charObj = data.character || data || {};

            // Ensure ID exists if missing
            if (!charObj.id) charObj.id = doc.id;

            // Ensure Name exists
            if (!charObj.name) charObj.name = "Unknown Hero";

            list.push(charObj);
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
                currentCampaignId: data.currentCampaignId || null,
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
          currentAdventureId: 'demo-adventure', // Default start
          currentCampaignId: null,
          gameMode: 'narrative',
          combat: { active: false, round: 0, turnOrder: [], currentTurnIndex: 0, victoryNode: null, defeatNode: null }
      });

      // Initial Save
      await saveGame(uid);

      // Refresh list
      await get().loadCharacterList(uid);
  },

  deleteCharacter: async (uid, characterId) => {
      try {
          if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
              const saves = JSON.parse(localStorage.getItem(`saves_${uid}`) || "{}");
              delete saves[characterId];
              localStorage.setItem(`saves_${uid}`, JSON.stringify(saves));
          } else {
              await deleteDoc(doc(db, "users", uid, "characters", characterId));
          }
          await get().loadCharacterList(uid);
      } catch (error) {
          console.error("Failed to delete character", error);
      }
  },

  startAdventure: async (adventureId, campaignId = null) => {
      // 1. Try to load adventure from Firestore
      try {
          const { addToLog } = get();
          let adventure = null;

          if (import.meta.env.VITE_FIREBASE_API_KEY === "dummy-key") {
              // Mock load from static file if ID matches demo, else fail
              if (adventureId === 'demo-adventure') {
                  // Dynamic import or just assume it's loaded?
                  // For dummy mode, we can't easily fetch dynamic content.
                  // Just warn.
                  console.warn("Mock Mode: Cannot load dynamic adventures. Using Default.");
                  return;
              }
          } else {
              const docSnap = await getDoc(doc(db, 'content_adventures', adventureId));
              if (docSnap.exists()) {
                  adventure = docSnap.data();
              }
          }

          if (adventure) {
              set({
                  currentAdventureId: adventureId,
                  currentCampaignId: campaignId,
                  activeAdventure: adventure,
                  currentNodeId: adventure.start_node || 'intro',
                  gameMode: 'narrative',
                  log: [{ id: Date.now(), text: `Starting ${adventure.title}...`, type: 'system' }]
              });

              // Ensure enemies are loaded?
              // NarrativeEngine handles enemy lookup, but needs to know if they exist in `itemLookup`?
              // No, enemies are in `monsters.json` (or `content_monsters`).
              // `initializeContent` should have loaded them into `itemLookup`? No, monsters aren't in `itemLookup`.
              // NarrativeEngine uses `allMonsters` memo. We need to make sure THAT uses dynamic content.

          } else {
              console.error("Adventure not found:", adventureId);
              addToLog({ text: "Failed to load adventure content.", type: 'system' });
          }
      } catch (e) {
          console.error("Error starting adventure:", e);
      }
  }
}));

export default useGameStore;
