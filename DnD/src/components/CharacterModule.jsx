import React from 'react';
import useGameStore from '../store/useGameStore';
import Card from './Card';
import { Shield, Heart, Activity } from 'lucide-react';

const CharacterModule = () => {
  const { character } = useGameStore();
  const { hp, ac, stats, initiative } = character;

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

  return (
    <Card title="Character Sheet" className="md:col-span-1 md:row-span-2">
      <div className="space-y-6">
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
    </Card>
  );
};

export default CharacterModule;
