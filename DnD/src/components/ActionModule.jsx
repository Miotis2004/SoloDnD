import React from 'react';
import useGameStore from '../store/useGameStore';
import Card from './Card';
import { Sword, Hand, Zap, ArrowLeft, BookOpen } from 'lucide-react';
import { spellLookup } from '../store/useGameStore';

const ActionButton = ({ icon, label, onClick, variant = 'default', disabled = false, subtitle = null }) => {
  const Icon = icon;
  const variants = {
    default: 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200',
    combat: 'bg-red-900/40 hover:bg-red-900/60 border-red-800 text-red-200',
    magic: 'bg-blue-900/40 hover:bg-blue-900/60 border-blue-800 text-blue-200',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 p-3 w-full rounded-lg border transition-all text-left group ${variants[variant]} ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
    >
      <div className="p-2 rounded bg-black/20 group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      <div className="flex flex-col">
        <span className="font-semibold">{label}</span>
        {subtitle && <span className="text-xs opacity-75">{subtitle}</span>}
      </div>
    </button>
  );
};

const ActionModule = ({ onAction, narrativeChoices = [], onNarrativeChoice }) => {
  // eslint-disable-next-line no-unused-vars
  const { gameMode, combat, pendingRoll, character, contentLoaded } = useGameStore();
  const [targetId, setTargetId] = React.useState('');
  const [showSpells, setShowSpells] = React.useState(false);

  const enemies = React.useMemo(() => {
    if (!combat || !combat.turnOrder) return [];
    return combat.turnOrder.filter(c => c.type !== 'player' && !c.isDead);
  }, [combat]);

  // Check if it is player's turn
  const isPlayerTurn = combat?.active && combat?.turnOrder[combat.currentTurnIndex]?.type === 'player';
  const isDisabled = pendingRoll !== null || (!isPlayerTurn && gameMode === 'combat');

  React.useEffect(() => {
    // Auto-select first enemy if target is invalid or not set
    if (enemies.length > 0 && (!targetId || !enemies.find(e => e.id === targetId))) {
      setTargetId(enemies[0].id);
    }
  }, [enemies, targetId]);

  const renderSpellMenu = () => {
      const knownSpells = (character.spells || []).map(id => spellLookup[id]).filter(Boolean);

      return (
          <div className="space-y-2 animate-in slide-in-from-right">
              <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setShowSpells(false)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  >
                      <ArrowLeft size={20} />
                  </button>
                  <span className="text-sm font-bold text-slate-300">Spellbook</span>
              </div>

              {knownSpells.length === 0 ? (
                  <div className="text-center text-slate-500 italic py-4">No spells known.</div>
              ) : (
                  knownSpells.map(spell => {
                      // Logic for disabling spells
                      const isHeal = spell.attackType === 'heal' || spell.attackType === 'buff';

                      // Filter for combat mode?
                      // The prompt says "Non-combat spells should be available all the time."
                      // But purely utility spells in combat might be useless if not implemented.
                      // Let's allow all for now but disable if no slots.

                      const level = spell.level;
                      const slots = character.spellSlots?.[level] || 0;
                      const hasSlots = level === 0 || slots > 0;

                      return (
                        <ActionButton
                            key={spell.id}
                            icon={isHeal ? Hand : Zap}
                            label={spell.name}
                            subtitle={level === 0 ? "Cantrip" : `Level ${level} (${slots} slots)`}
                            variant="magic"
                            disabled={!hasSlots}
                            onClick={() => {
                                // If heal/buff, target might be self or ally. For Solo, assume self if no ally system.
                                // If Attack, use selected target.
                                const target = (isHeal || spell.range === 'Self') ? 'player' : targetId;
                                onAction('cast', target, spell.id);
                                setShowSpells(false);
                            }}
                        />
                      );
                  })
              )}
          </div>
      );
  };

  return (
    <Card
        title="Actions"
        className={`md:col-span-1 md:row-span-2 transition-opacity ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
        actions={
            // Shortcut to spells in narrative mode if needed, or just rely on the main list
            gameMode === 'narrative' && !showSpells && (
                <div className="flex gap-1">
                    <button
                        onClick={() => onAction('rest')}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-green-400 transition-colors"
                        title="Long Rest"
                    >
                        <div className="text-[10px] font-bold border border-current px-1 rounded">REST</div>
                    </button>
                    <button
                        onClick={() => setShowSpells(true)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                        title="Open Spellbook"
                    >
                        <BookOpen size={16} />
                    </button>
                </div>
            )
        }
    >
      <div className="space-y-3">
        {showSpells ? renderSpellMenu() : (
            gameMode === 'narrative' ? (
            <div className="flex flex-col gap-2">
                {/* Spellbook Button for Narrative Mode */}
                <ActionButton
                    icon={Zap}
                    label="Cast Spell"
                    variant="magic"
                    onClick={() => setShowSpells(true)}
                    disabled={pendingRoll !== null}
                />

                {narrativeChoices.map((choice, idx) => (
                <button
                    key={idx}
                    onClick={() => onNarrativeChoice(choice)}
                    disabled={pendingRoll !== null}
                    className={`p-3 text-left bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 transition-colors ${pendingRoll ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                {/* Target Selector */}
                <div className="mb-2">
                <label className="text-xs text-slate-400 block mb-1">Target</label>
                <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                >
                    {enemies.map(enemy => (
                    <option key={enemy.id} value={enemy.id}>
                        {enemy.name} (HP: {enemy.currentHp})
                    </option>
                    ))}
                    {enemies.length === 0 && <option>No targets</option>}
                </select>
                </div>

                <ActionButton
                icon={Sword}
                label="Main Hand Attack"
                variant="combat"
                onClick={() => onAction('attack', targetId)}
                />
                <ActionButton
                icon={Zap}
                label="Cast Spell"
                variant="magic"
                onClick={() => setShowSpells(true)}
                />
                <ActionButton
                icon={Hand}
                label="Use Item / Interaction"
                onClick={() => onAction('interact', targetId)}
                />
            </>
            )
        )}
      </div>
    </Card>
  );
};

export default ActionModule;
