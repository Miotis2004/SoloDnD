import React, { useState } from 'react';
import useGameStore, { itemLookup } from '../store/useGameStore';
import Card from './Card';
import { Shield, Heart, Activity, Briefcase, User, Check, X, MousePointer } from 'lucide-react';

const StatBlock = ({ label, value }) => {
  const mod = Math.floor((value - 10) / 2);
  const modStr = mod >= 0 ? `+${mod}` : mod;

  return (
    <div className="flex flex-col items-center bg-slate-800/50 p-2 rounded-lg border border-slate-700">
      <span className="text-xs font-bold text-slate-400 uppercase">{label}</span>
      <span className="text-xl font-bold text-white">{value}</span>
      <span className="text-xs text-dnd-accent font-mono">{modStr}</span>
    </div>
  );
};

const CharacterModule = () => {
  const { character, equipItem, useItem: consumeItem } = useGameStore();
  const { hp, ac, stats, initiative, inventory, equipment } = character;
  const [activeTab, setActiveTab] = useState('stats');

  const renderStats = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Stats */}
      <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg">
         <div className="text-center">
           <div className="flex items-center gap-1 text-red-500 justify-center">
             <Heart size={18} fill="currentColor" />
           </div>
           <div className="text-lg font-bold text-white">{hp.current} / {hp.max}</div>
           <div className="text-xs text-slate-500">Hit Points</div>
         </div>

         <div className="text-center border-l border-slate-700 pl-4">
           <div className="flex items-center gap-1 text-slate-300 justify-center">
             <Shield size={18} />
           </div>
           <div className="text-lg font-bold text-white">{ac}</div>
           <div className="text-xs text-slate-500">AC</div>
         </div>

         <div className="text-center border-l border-slate-700 pl-4">
           <div className="flex items-center gap-1 text-yellow-500 justify-center">
             <Activity size={18} />
           </div>
           <div className="text-lg font-bold text-white">+{initiative}</div>
           <div className="text-xs text-slate-500">Init</div>
         </div>
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-3 gap-2">
        <StatBlock label="STR" value={stats.str} />
        <StatBlock label="DEX" value={stats.dex} />
        <StatBlock label="CON" value={stats.con} />
        <StatBlock label="INT" value={stats.int} />
        <StatBlock label="WIS" value={stats.wis} />
        <StatBlock label="CHA" value={stats.cha} />
      </div>

      {/* Skills Preview */}
      <div>
        <h4 className="text-sm font-bold text-slate-400 mb-2 border-b border-slate-700 pb-1">Proficiencies</h4>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">Simple Weapons</span>
          <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">Light Armor</span>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-3 animate-in fade-in duration-300 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
      {inventory.length === 0 ? (
        <div className="text-center text-slate-500 italic py-8">Empty Inventory</div>
      ) : (
        inventory.map((invItem, idx) => {
          const item = itemLookup[invItem.id];
          if (!item) return null; // Should not happen

          const isEquipped =
            equipment.mainHand === invItem.id ||
            equipment.offHand === invItem.id ||
            equipment.body === invItem.id;

          const isConsumable = item.type === 'consumable';
          const isEquipable = item.type === 'weapon' || item.type === 'armor' || item.slot === 'offHand';

          return (
            <div key={idx} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    {item.name}
                    <span className="text-xs text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded-full">x{invItem.qty}</span>
                    {isEquipped && <span className="text-xs text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded border border-green-800 flex items-center gap-1"><Check size={10} /> Eqp</span>}
                  </div>
                  <div className="text-xs text-slate-400 italic">
                    {item.type} &bull; {item.rarity}
                    {item.damage && ` \u2022 ${item.damage} ${item.damageType}`}
                    {item.armorClass && ` \u2022 AC ${item.armorClass}`}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-700/50 pt-2 mt-1">
                {item.description}
              </div>

              <div className="flex gap-2 mt-1">
                {isEquipable && (
                  <button
                    onClick={() => equipItem(invItem.id)}
                    className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors ${
                      isEquipped
                        ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                     {isEquipped ? <><X size={12}/> Unequip</> : <><Shield size={12}/> Equip</>}
                  </button>
                )}
                {isConsumable && (
                  <button
                    onClick={() => consumeItem(invItem.id)}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <MousePointer size={12}/> Use
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <Card
      className="md:col-span-1 md:row-span-2 flex flex-col h-full"
      title="Character Sheet"
      actions={
        <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`p-1.5 rounded transition-colors ${activeTab === 'stats' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            title="Stats"
          >
            <User size={16} />
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`p-1.5 rounded transition-colors ${activeTab === 'inventory' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            title="Inventory"
          >
            <Briefcase size={16} />
          </button>
        </div>
      }
    >
      {activeTab === 'stats' ? renderStats() : renderInventory()}
    </Card>
  );
};

export default CharacterModule;
