import React, { useState } from 'react';
import useGameStore, { spellLookup } from '../store/useGameStore';
import useAuthStore from '../store/useAuthStore';
import { Sword, Shield, Book, Heart, Sparkles, Footprints, Flame, Skull, Moon, Sun, Hammer, Scroll } from 'lucide-react';

const CLASSES = {
  Barbarian: {
    description: "A fierce warrior of primitive background.",
    icon: Shield,
    stats: { str: 16, dex: 14, con: 16, int: 8, wis: 10, cha: 8 },
    hp: 14,
    equipment: { mainHand: 'greataxe', body: 'hide' },
    inventory: [{ id: 'healing_potion', qty: 2 }],
    spellSlots: {}
  },
  Bard: {
    description: "An inspiring magician whose power echoes the music of creation.",
    icon: Scroll,
    stats: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 16 },
    hp: 10,
    equipment: { mainHand: 'rapier', body: 'leather' },
    inventory: [{ id: 'healing_potion', qty: 1 }],
    spellSlots: { 1: 2 },
    knownSpells: { cantrips: 2, level1: 4 }
  },
  Cleric: {
    description: "A priestly champion who wields divine magic.",
    icon: Heart,
    stats: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 10 },
    hp: 10,
    equipment: { mainHand: 'mace', offHand: 'shield', body: 'scale_mail' },
    inventory: [{ id: 'healing_potion', qty: 2 }],
    spellSlots: { 1: 2 },
    preparedCaster: true
  },
  Druid: {
    description: "A priest of the Old Faith, wielding the powers of nature.",
    icon: Moon,
    stats: { str: 10, dex: 12, con: 14, int: 12, wis: 16, cha: 8 },
    hp: 10,
    equipment: { mainHand: 'scimitar', offHand: 'shield', body: 'leather' },
    inventory: [{ id: 'healing_potion', qty: 1 }],
    spellSlots: { 1: 2 },
    preparedCaster: true
  },
  Fighter: {
    description: "A master of martial combat.",
    icon: Sword,
    stats: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
    hp: 12,
    equipment: { mainHand: 'longsword', body: 'chainmail' },
    inventory: [{ id: 'healing_potion', qty: 2 }],
    spellSlots: {}
  },
  Monk: {
    description: "A master of martial arts, harnessing the power of the body.",
    icon: Footprints,
    stats: { str: 10, dex: 16, con: 14, int: 10, wis: 16, cha: 8 },
    hp: 10,
    equipment: { mainHand: 'shortsword', body: 'none' }, // Unarmored
    inventory: [{ id: 'healing_potion', qty: 1 }],
    spellSlots: {}
  },
  Paladin: {
    description: "A holy warrior bound to a sacred oath.",
    icon: Sun,
    stats: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 16 },
    hp: 12,
    equipment: { mainHand: 'longsword', offHand: 'shield', body: 'chainmail' },
    inventory: [{ id: 'healing_potion', qty: 1 }],
    spellSlots: {}, // Paladins get spells at lvl 2
    preparedCaster: true
  },
  Ranger: {
    description: "A warrior who uses martial prowess and nature magic.",
    icon: Book,
    stats: { str: 12, dex: 16, con: 14, int: 10, wis: 14, cha: 8 },
    hp: 12,
    equipment: { mainHand: 'longbow', body: 'leather' },
    inventory: [{ id: 'healing_potion', qty: 2 }],
    spellSlots: {}, // Rangers get spells at lvl 2
    knownSpells: { cantrips: 0, level1: 0 }
  },
  Rogue: {
    description: "A scoundrel who uses stealth and trickery.",
    icon: Skull,
    stats: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 12 },
    hp: 10,
    equipment: { mainHand: 'shortsword', body: 'leather' },
    inventory: [{ id: 'healing_potion', qty: 1 }, { id: 'thieves_tools', qty: 1 }],
    spellSlots: {}
  },
  Sorcerer: {
    description: "A spellcaster who draws on inherent magic from a gift or bloodline.",
    icon: Flame,
    stats: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 16 },
    hp: 8,
    equipment: { mainHand: 'quarterstaff', body: 'none' },
    inventory: [{ id: 'healing_potion', qty: 1 }],
    spellSlots: { 1: 2 },
    knownSpells: { cantrips: 4, level1: 2 }
  },
  Warlock: {
    description: "A wielder of magic that is derived from a bargain with an extraplanar entity.",
    icon: Moon, // Reused icon or new one
    stats: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 16 },
    hp: 10,
    equipment: { mainHand: 'dagger', body: 'leather' },
    inventory: [{ id: 'healing_potion', qty: 1 }],
    spellSlots: { 1: 1 }, // Pact Magic
    knownSpells: { cantrips: 2, level1: 2 }
  },
  Wizard: {
    description: "A scholarly magic-user.",
    icon: Sparkles,
    stats: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
    hp: 8,
    equipment: { mainHand: 'quarterstaff', body: 'padded' },
    inventory: [{ id: 'healing_potion', qty: 1 }],
    spellSlots: { 1: 2 },
    knownSpells: { cantrips: 3, level1: 6 } // Spellbook
  }
};

const STAT_NAMES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const BASE_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

const CharacterCreator = ({ onCancel, onComplete }) => {
  const { user } = useAuthStore();
  const { createNewCharacter } = useGameStore();

  const [step, setStep] = useState(1); // 1: Details, 2: Stats, 3: Spells (if applicable)
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState('Fighter');
  const [stats, setStats] = useState({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
  const [pointsRemaining, setPointsRemaining] = useState(27);
  const [selectedSpells, setSelectedSpells] = useState([]); // List of spell IDs

  const handleStatChange = (stat, delta) => {
    const currentVal = stats[stat];
    const newVal = currentVal + delta;

    if (newVal < 8 || newVal > 15) return;

    const currentCost = BASE_COSTS[currentVal];
    const newCost = BASE_COSTS[newVal];
    const costDiff = newCost - currentCost;

    if (pointsRemaining - costDiff < 0) return;

    setStats({ ...stats, [stat]: newVal });
    setPointsRemaining(pointsRemaining - costDiff);
  };

  const handleCreate = async () => {
    const classData = CLASSES[selectedClass];

    // Determine Spells: Either user selected or all prepared/auto-assigned
    let charSpells = [];
    if (classData.preparedCaster) {
        // Give all Level 1 spells for that class (and cantrips if any)
        // Note: Logic for finding all level 1 spells for a class requires scanning spellLookup
        // We will do a simple filter here if we can access spellLookup
        const allSpells = Object.values(spellLookup);
        charSpells = allSpells
            .filter(s => s.classes?.includes(selectedClass) && (s.level === 0 || s.level === 1))
            .map(s => s.id);
    } else if (classData.knownSpells) {
        charSpells = selectedSpells;
    } else {
        charSpells = []; // Martial classes
    }

    const newCharData = {
      name,
      class: selectedClass,
      hp: { current: classData.hp, max: classData.hp },
      maxHp: classData.hp, // Helper for create function
      stats, // User customized stats
      equipment: classData.equipment,
      inventory: classData.inventory,
      spells: charSpells,
      spellSlots: classData.spellSlots,
      maxSpellSlots: classData.spellSlots
    };

    await createNewCharacter(user.uid, newCharData);
    onComplete();
  };

  const renderClassSelection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(CLASSES).map(([className, info]) => {
          const Icon = info.icon;
          const isSelected = selectedClass === className;
          return (
            <button
              key={className}
              onClick={() => {
                  setSelectedClass(className);
                  // Reset stats to base 8 when switching? Or keep?
                  // Let's reset for simplicity or maybe pre-fill?
                  // The prompt implies point buy is manual.
              }}
              className={`p-3 rounded-lg border text-left transition-all ${isSelected ? 'bg-dnd-accent border-red-400 text-white shadow-lg scale-105' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={18} />
                <span className="font-bold">{className}</span>
              </div>
              <div className="text-xs opacity-75 leading-tight">{info.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderPointBuy = () => (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
        <h3 className="font-bold text-slate-200">Ability Scores</h3>
        <div className={`font-mono font-bold ${pointsRemaining === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
           Points: {pointsRemaining}/27
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STAT_NAMES.map(stat => (
          <div key={stat} className="flex flex-col items-center bg-slate-900 p-2 rounded border border-slate-800">
            <span className="text-xs uppercase font-bold text-slate-500 mb-1">{stat}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStatChange(stat, -1)}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                disabled={stats[stat] <= 8}
              >
                -
              </button>
              <span className="font-bold text-xl text-white w-6 text-center">{stats[stat]}</span>
              <button
                onClick={() => handleStatChange(stat, 1)}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                disabled={stats[stat] >= 15 || pointsRemaining <= 0} // technically checks cost logic in handler
              >
                +
              </button>
            </div>
            <div className="text-xs text-slate-600 mt-1">Cost: {BASE_COSTS[stats[stat]]}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSpellSelection = () => {
      const classData = CLASSES[selectedClass];
      const maxCantrips = classData.knownSpells?.cantrips || 0;
      const maxLevel1 = classData.knownSpells?.level1 || 0;

      const availableSpells = Object.values(spellLookup).filter(s => s.classes?.includes(selectedClass));
      const cantrips = availableSpells.filter(s => s.level === 0);
      const level1Spells = availableSpells.filter(s => s.level === 1);

      const selectedCantrips = selectedSpells.filter(id => cantrips.find(s => s.id === id));
      const selectedLevel1 = selectedSpells.filter(id => level1Spells.find(s => s.id === id));

      const toggleSpell = (id, currentCount, max) => {
          if (selectedSpells.includes(id)) {
              setSelectedSpells(selectedSpells.filter(s => s !== id));
          } else {
              if (currentCount >= max) return;
              setSelectedSpells([...selectedSpells, id]);
          }
      };

      return (
          <div className="space-y-6 animate-in slide-in-from-right">
              <h3 className="text-xl font-bold text-slate-200">Select Spells</h3>

              {/* Cantrips */}
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex justify-between mb-2">
                      <h4 className="font-bold text-slate-300">Cantrips</h4>
                      <span className={`${selectedCantrips.length === maxCantrips ? 'text-green-400' : 'text-yellow-400'}`}>
                          {selectedCantrips.length} / {maxCantrips}
                      </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      {cantrips.map(spell => (
                          <button
                            key={spell.id}
                            onClick={() => toggleSpell(spell.id, selectedCantrips.length, maxCantrips)}
                            className={`p-2 rounded border text-left text-sm ${selectedSpells.includes(spell.id) ? 'bg-blue-900 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                          >
                              {spell.name}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Level 1 */}
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex justify-between mb-2">
                      <h4 className="font-bold text-slate-300">Level 1 Spells</h4>
                      <span className={`${selectedLevel1.length === maxLevel1 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {selectedLevel1.length} / {maxLevel1}
                      </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      {level1Spells.map(spell => (
                          <button
                            key={spell.id}
                            onClick={() => toggleSpell(spell.id, selectedLevel1.length, maxLevel1)}
                            className={`p-2 rounded border text-left text-sm ${selectedSpells.includes(spell.id) ? 'bg-blue-900 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                          >
                              {spell.name}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  const hasSpellsToSelect = CLASSES[selectedClass].knownSpells !== undefined;

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
       <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
          {step === 1 && (
             <div className="space-y-6 animate-in slide-in-from-right">
                <div>
                   <label className="block text-sm font-bold text-slate-400 mb-1">Character Name</label>
                   <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-dnd-accent outline-none"
                      placeholder="Enter name..."
                   />
                </div>
                {renderClassSelection()}
             </div>
          )}

          {step === 2 && (
             <div className="space-y-6 animate-in slide-in-from-right">
                 {renderPointBuy()}

                 <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="font-bold text-slate-300 mb-2">Starting Equipment</h3>
                    <div className="text-sm text-slate-400">
                       Main Hand: <span className="text-white">{CLASSES[selectedClass].equipment.mainHand}</span><br/>
                       Body: <span className="text-white">{CLASSES[selectedClass].equipment.body}</span>
                    </div>
                 </div>
             </div>
          )}

          {step === 3 && hasSpellsToSelect && renderSpellSelection()}
       </div>

       <div className="mt-6 flex justify-between border-t border-slate-800 pt-4">
          <button onClick={step === 1 ? onCancel : () => setStep(step - 1)} className="text-slate-500 hover:text-white px-4">
              {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step === 1 && (
             <button
                onClick={() => setStep(2)}
                disabled={!name}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded disabled:opacity-50"
             >
                Next: Stats
             </button>
          )}

          {step === 2 && (
              hasSpellsToSelect ? (
                <button
                    onClick={() => setStep(3)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded"
                >
                    Next: Spells
                </button>
              ) : (
                <button
                    onClick={handleCreate}
                    className="bg-dnd-accent hover:bg-red-700 text-white px-6 py-2 rounded font-bold"
                >
                    Create Character
                </button>
              )
          )}

          {step === 3 && (
              <button
                onClick={handleCreate}
                className="bg-dnd-accent hover:bg-red-700 text-white px-6 py-2 rounded font-bold"
              >
                Create Character
              </button>
          )}
       </div>
    </div>
  );
};

export default CharacterCreator;
