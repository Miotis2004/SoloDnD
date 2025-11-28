import React from 'react';
import useGameStore from '../store/useGameStore';
import Card from './Card';
import { Skull, Shield, Sword } from 'lucide-react';

const CombatTracker = () => {
  const { combat } = useGameStore();
  const { turnOrder, currentTurnIndex, round } = combat;

  if (!combat.active) return null;

  return (
    <Card title={`Combat Tracker - Round ${round}`} className="md:col-span-1 border-red-900/50">
      <div className="space-y-2">
        {turnOrder.map((combatant, idx) => {
          const isActive = idx === currentTurnIndex;
          const isPlayer = combatant.type === 'player';
          const isDead = combatant.isDead;

          return (
            <div
              key={combatant.id}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-all
                ${isActive ? 'bg-dnd-accent/20 border-dnd-accent scale-105 shadow-lg' : 'bg-slate-800/50 border-slate-700'}
                ${isDead ? 'opacity-50 grayscale' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded flex items-center justify-center font-bold text-sm
                  ${isPlayer ? 'bg-blue-600 text-white' : 'bg-red-800 text-red-100'}
                `}>
                  {combatant.initiative}
                </div>

                <div className="flex flex-col">
                  <span className={`font-bold ${isPlayer ? 'text-blue-200' : 'text-red-200'}`}>
                    {combatant.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Shield size={12} /> {combatant.ac}
                    </span>
                    {!isPlayer && (
                        <span className="flex items-center gap-1">
                           HP: {combatant.currentHp}/{combatant.maxHp}
                        </span>
                    )}
                  </div>
                </div>
              </div>

              {isDead ? (
                <Skull size={20} className="text-slate-500" />
              ) : isActive && (
                <Sword size={20} className="text-dnd-accent animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default CombatTracker;
