import { useState } from 'react';
import { X, Dices, Swords, Shield, Zap, Sparkles } from 'lucide-react';
import { PBTA_MOVES, executePbtaRoll } from '../engine/pbtaEngine';

export default function PbtaRollModal({ isOpen, onClose, sheet, onRollConfirmed }) {
  const [selectedMove, setSelectedMove] = useState(PBTA_MOVES[0]);
  const [customDetail, setCustomDetail] = useState('');
  const [lastRoll, setLastRoll] = useState(null);

  if (!isOpen) return null;

  const handleRoll = () => {
    const mod = sheet.stats[selectedMove.attribute] || 0;
    const result = executePbtaRoll({
      move: selectedMove,
      attributeModifier: mod,
      customAction: customDetail,
    });
    setLastRoll(result);
  };

  const handleConfirmToChat = () => {
    if (!lastRoll) return;
    onRollConfirmed(lastRoll);
    setLastRoll(null);
    setCustomDetail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-lg bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-rose-400" />
            <h2 className="text-sm font-bold text-zinc-100">Movimento PbtA (Dungeon World)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {!lastRoll ? (
            <>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Escolha o Movimento de acordo com sua intenção na cena. O motor rolará <strong>2d6 + seu Atributo</strong>.
              </p>

              {/* Grid de Movimentos */}
              <div className="grid grid-cols-2 gap-2">
                {PBTA_MOVES.map((m) => {
                  const mod = sheet.stats[m.attribute] || 0;
                  const isSelected = selectedMove.id === m.id;

                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMove(m)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500 text-zinc-100 shadow-md'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{m.icon}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          mod >= 0 ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-800 text-rose-400'
                        }`}>
                          {m.attribute} {mod >= 0 ? `+${mod}` : mod}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-zinc-200 truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Detalhes do Movimento Selecionado */}
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-rose-400">Gatilho do Movimento:</span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">{selectedMove.description}</p>
                <div className="pt-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Descreva sua ação específica (opcional):</label>
                  <input
                    type="text"
                    value={customDetail}
                    onChange={(e) => setCustomDetail(e.target.value)}
                    placeholder="Ex: Golpeio o líder orc com um corte ascendente..."
                    className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Botão Rolar 2d6 */}
              <button
                onClick={handleRoll}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-zinc-100 font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
              >
                <Dices className="w-4 h-4" />
                <span>Rolar 2d6 + {selectedMove.attribute} ({sheet.stats[selectedMove.attribute] >= 0 ? `+${sheet.stats[selectedMove.attribute]}` : sheet.stats[selectedMove.attribute]})</span>
              </button>
            </>
          ) : (
            /* Tela do Resultado Sagrado */
            <div className="space-y-4 text-center py-2">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border-2 border-rose-500/50 flex items-center justify-center text-xl font-black text-zinc-100">
                  {lastRoll.d1}
                </div>
                <span className="text-xl font-bold text-zinc-500">+</span>
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border-2 border-rose-500/50 flex items-center justify-center text-xl font-black text-zinc-100">
                  {lastRoll.d2}
                </div>
                <span className="text-xl font-bold text-zinc-500">+</span>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm font-bold text-amber-400">
                  {lastRoll.modifier >= 0 ? `+${lastRoll.modifier}` : lastRoll.modifier}
                </div>
                <span className="text-xl font-bold text-zinc-500">=</span>
                <div className="w-14 h-14 rounded-2xl bg-zinc-950 border-2 border-amber-500 flex items-center justify-center text-2xl font-black text-amber-400 shadow-xl">
                  {lastRoll.finalTotal}
                </div>
              </div>

              {/* Veredito */}
              <div className={`p-4 rounded-xl border ${
                lastRoll.tier === '10+'
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                  : lastRoll.tier === '7-9'
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                  : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
              }`}>
                <h3 className="font-black text-base tracking-wide uppercase">{lastRoll.tierName}</h3>
                <p className="text-xs mt-1.5 leading-relaxed text-zinc-200">{lastRoll.instruction}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setLastRoll(null)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-lg transition"
                >
                  Rolar Novamente
                </button>
                <button
                  onClick={handleConfirmToChat}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-zinc-100 font-bold text-xs rounded-lg shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enviar para Narrativa</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
