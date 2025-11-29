import React, { useState } from 'react';
import useGameStore from '../store/useGameStore';
import Card from './Card';
import { Dices } from 'lucide-react';

const DiceModule = () => {
  const { rollDice, addToLog, pendingRoll, resolveDiceRoll } = useGameStore();
  const [lastRoll, setLastRoll] = useState(null);

  const handleRoll = (sides) => {
    // If there is a pending roll, ensure we clicked the right die
    if (pendingRoll) {
        if (sides !== pendingRoll.sides) {
            addToLog({ text: `Incorrect die! Please roll d${pendingRoll.sides}.`, type: 'system' });
            return;
        }

        const result = rollDice(sides);
        setLastRoll({ sides, ...result });

        // Resolve the game state with this roll
        resolveDiceRoll(sides, result.total);
        return;
    }

    // Fluff Roll
    const result = rollDice(sides);
    setLastRoll({ sides, ...result });
    addToLog({ 
      text: `(Fluff) Rolled d${sides}: ${result.total} (Natural ${result.roll})`,
      type: 'system' 
    });
  };

  return (
    <Card title="Dice Tray" className="md:col-span-1">
      <div className="flex flex-col items-center justify-center h-full gap-4">
        {pendingRoll && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 p-2 rounded text-center w-full animate-pulse">
                <div className="text-yellow-200 font-bold text-sm">{pendingRoll.label}</div>
                <div className="text-xs text-yellow-500">Waiting for d{pendingRoll.sides}...</div>
            </div>
        )}

        {lastRoll && !pendingRoll && (
           <div className="text-center animate-bounce">
             <div className="text-4xl font-black text-dnd-accent">{lastRoll.total}</div>
             <div className="text-xs text-slate-500">d{lastRoll.sides} Result</div>
           </div>
        )}

        <div className="grid grid-cols-3 gap-2 w-full">
          {[4, 6, 8, 10, 12, 20].map(d => {
            const isPending = pendingRoll && pendingRoll.sides === d;
            return (
                <button
                key={d}
                onClick={() => handleRoll(d)}
                className={`
                    p-2 rounded border font-bold text-sm transition-all flex flex-col items-center gap-1
                    ${isPending
                        ? 'bg-yellow-600 hover:bg-yellow-500 border-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-105'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'
                    }
                    ${pendingRoll && !isPending ? 'opacity-30 cursor-not-allowed' : ''}
                `}
                disabled={pendingRoll && !isPending}
                >
                <Dices size={16} className={isPending ? 'animate-spin' : 'opacity-50'} />
                d{d}
                </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default DiceModule;
