import React, { useState } from 'react';
import useGameStore from '../store/useGameStore';
import Card from './Card';
import { Dices } from 'lucide-react';

const DiceModule = () => {
  const { rollDice, addToLog } = useGameStore();
  const [lastRoll, setLastRoll] = useState(null);

  const handleRoll = (sides) => {
    const result = rollDice(sides);
    setLastRoll({ sides, ...result });
    addToLog({ 
      text: `Rolled d${sides}: ${result.total} (Natural ${result.roll})`, 
      type: 'system' 
    });
  };

  return (
    <Card title="Dice Tray" className="md:col-span-1">
      <div className="flex flex-col items-center justify-center h-full gap-4">
        {lastRoll && (
           <div className="text-center animate-bounce">
             <div className="text-4xl font-black text-dnd-accent">{lastRoll.total}</div>
             <div className="text-xs text-slate-500">d{lastRoll.sides} Result</div>
           </div>
        )}

        <div className="grid grid-cols-3 gap-2 w-full">
          {[4, 6, 8, 10, 12, 20].map(d => (
            <button
              key={d}
              onClick={() => handleRoll(d)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 text-slate-300 font-bold text-sm transition-colors flex flex-col items-center gap-1"
            >
              <Dices size={16} className="opacity-50" />
              d{d}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default DiceModule;
