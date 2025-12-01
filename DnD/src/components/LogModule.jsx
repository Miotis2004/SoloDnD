import React, { useEffect, useRef, useState } from 'react';
import useGameStore from '../store/useGameStore';
import Card from './Card';
import { Loader2, Square, Volume2 } from 'lucide-react';

const LogModule = () => {
  const { log, pendingRoll } = useGameStore();
  const bottomRef = useRef(null);
  const speechRef = useRef(null);
  const utterancesRef = useRef([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  useEffect(() => {
    if (speechSupported) {
      speechRef.current = window.speechSynthesis;
    }

    return () => {
      speechRef.current?.cancel();
    };
  }, [speechSupported]);

  const stopSpeech = () => {
    speechRef.current?.cancel();
    utterancesRef.current = [];
    setIsSpeaking(false);
  };

  const speakLog = () => {
    if (!speechSupported || !speechRef.current || !log.length) return;

    stopSpeech();
    const utterances = log.map((entry, index) => {
      const utterance = new SpeechSynthesisUtterance(
        `${entry.title ? `${entry.title}. ` : ''}${entry.text}`
      );
      utterance.rate = 1.05;
      utterance.onend = () => {
        if (index === log.length - 1) {
          setIsSpeaking(false);
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      return utterance;
    });

    utterancesRef.current = utterances;
    setIsSpeaking(true);
    utterances.forEach((utterance) => speechRef.current.speak(utterance));
  };

  const actions = (
    <button
      type="button"
      onClick={isSpeaking ? stopSpeech : speakLog}
      disabled={!speechSupported || !log.length}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide bg-slate-800 border border-slate-700 rounded-md text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSpeaking ? <Square size={14} /> : <Volume2 size={14} />}
      {isSpeaking ? 'Stop' : 'Read Aloud'}
    </button>
  );

  return (
    <Card title="Adventure Log" className="md:col-span-2 md:row-span-2" actions={actions}>
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

        {pendingRoll && (
             <div className="p-3 rounded-lg border bg-yellow-900/20 border-yellow-700/50 text-yellow-200 flex items-center gap-3 animate-pulse">
                <Loader2 className="animate-spin" size={20} />
                <span className="font-bold text-sm">Waiting for Player: {pendingRoll.label} (d{pendingRoll.sides})</span>
             </div>
        )}

        <div ref={bottomRef} />
      </div>
    </Card>
  );
};

export default LogModule;
