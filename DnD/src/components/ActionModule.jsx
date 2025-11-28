import React from 'react';
import useGameStore from '../store/useGameStore';
import Card from './Card';
import { Sword, Hand, Zap } from 'lucide-react';

const ActionButton = ({ icon, label, onClick, variant = 'default' }) => {
  const Icon = icon;
  const variants = {
    default: 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200',
    combat: 'bg-red-900/40 hover:bg-red-900/60 border-red-800 text-red-200',
    magic: 'bg-blue-900/40 hover:bg-blue-900/60 border-blue-800 text-blue-200',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 w-full rounded-lg border transition-all text-left group ${variants[variant]}`}
    >
      <div className="p-2 rounded bg-black/20 group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      <span className="font-semibold">{label}</span>
    </button>
  );
};

const ActionModule = ({ onAction, narrativeChoices = [], onNarrativeChoice }) => {
  const { gameMode } = useGameStore();

  return (
    <Card title="Actions" className="md:col-span-1 md:row-span-2">
      <div className="space-y-3">
        {gameMode === 'narrative' ? (
          <div className="flex flex-col gap-2">
            {narrativeChoices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => onNarrativeChoice(choice)}
                className="p-3 text-left bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 transition-colors"
              >
                <div className="font-semibold">{choice.label}</div>
                {choice.check && (
                  <div className="text-xs text-dnd-accent mt-1">
                    Check: {choice.check.stat.toUpperCase()} DC {choice.check.dc}
                  </div>
                )}
              </button>
            ))}
            {narrativeChoices.length === 0 && (
               <div className="text-center text-slate-500 italic py-4">
                  No actions available.
               </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-xs font-bold text-slate-500 uppercase mb-2">Combat Actions</div>
            <ActionButton 
              icon={Sword} 
              label="Main Hand Attack" 
              variant="combat"
              onClick={() => onAction('attack')}
            />
            <ActionButton 
              icon={Zap} 
              label="Cast Spell" 
              variant="magic"
              onClick={() => onAction('cast')}
            />
            <ActionButton 
              icon={Hand} 
              label="Use Item / Interaction" 
              onClick={() => onAction('interact')}
            />
          </>
        )}
      </div>
    </Card>
  );
};

export default ActionModule;
