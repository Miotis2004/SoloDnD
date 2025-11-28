import React, { useEffect, useRef } from 'react';
import useGameStore from '../store/useGameStore';
import Card from './Card';

const LogModule = () => {
  const { log } = useGameStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <Card title="Adventure Log" className="md:col-span-2 md:row-span-2">
      <div className="flex flex-col h-full gap-4">
        {log.map((entry) => (
          <div 
            key={entry.id} 
            className={`p-3 rounded-lg border ${
              entry.type === 'combat' 
                ? 'bg-red-900/20 border-red-900/50 text-red-200' 
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
            }`}
          >
            {entry.title && <div className="font-bold text-sm mb-1 opacity-75">{entry.title}</div>}
            <p className="leading-relaxed">{entry.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </Card>
  );
};

export default LogModule;
