import React from 'react';

export default function SceneDirectorBar({
  cast = [],
  selectedDirectorNpcId = null, // null = Automático
  onSelectDirectorNpc,          // (npcId | null) => void
  onTriggerNpcTurn,             // (npc) => void (opcional: toca 2x ou botão "Falar agora")
  disabled = false,
}) {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="w-full px-3 py-1.5 bg-zinc-950/90 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
      {/* Pílula Modo Automático */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelectDirectorNpc(null)}
        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition active:scale-95 ${
          selectedDirectorNpcId === null
            ? 'bg-amber-500 text-black border-amber-400 font-semibold'
            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
        }`}
      >
        <span>🎬</span>
        <span>Auto</span>
      </button>

      {/* Pílulas com mini-avatares dos NPCs da sessão */}
      {cast.map((npc) => {
        const isSelected = selectedDirectorNpcId === npc.id;
        const avatarUrl = npc.avatarUrl || npc.imageUrl || '';

        return (
          <div key={npc.id} className="shrink-0 flex items-center">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (isSelected && onTriggerNpcTurn) {
                  // Segundo toque no NPC já selecionado dispara o turno dele direto!
                  onTriggerNpcTurn(npc);
                } else {
                  onSelectDirectorNpc(npc.id);
                }
              }}
              className={`flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full text-xs border transition active:scale-95 ${
                isSelected
                  ? 'bg-purple-600/30 text-purple-200 border-purple-400 font-semibold shadow-sm shadow-purple-500/20'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
              title={
                isSelected
                  ? `Toque novamente para ${npc.name} agir agora`
                  : `Dar foco do próximo turno para ${npc.name}`
              }
            >
              <span className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={npc.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-amber-400">
                    {npc.name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </span>
              <span className="max-w-[90px] truncate">{npc.name}</span>
              {isSelected && <span className="text-[10px] text-purple-300">▶</span>}
            </button>
          </div>
        );
      })}
    </div>
  );
}