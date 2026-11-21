import React, { useState } from 'react';
import ImagePicker from './ImagePicker';

export default function WorldLobbyModal({
  world,          // Objeto da sessão (character ou campaign)
  cast = [],      // Lista de NPCs do Codex vinculados a essa sessão
  onClose,
  onEnterChat,    // (world) => void
  onUpdateCover,  // (worldId, newCoverUrl) => Promise<void>
  onOpenLightbox, // (items, index) => void
  onDeleteWorld,  // (world) => void
}) {
  const [editingCover, setEditingCover] = useState(false);
  const [savingCover, setSavingCover] = useState(false);
  const [coverError, setCoverError] = useState('');

  if (!world) return null;

  const isRpg = world.type === 'rpg';
  const coverUrl = world.coverUrl || world.avatarUrl || '';
  const title = world.name || world.title || 'Mundo sem título';
  const description =
    world.description ||
    world.premise ||
    world.scenario ||
    'Nenhuma sinopse cadastrada para este mundo.';

  // Monta galeria para o Lightbox (capa + retratos do elenco)
  const lightboxItems = [
    ...(coverUrl ? [{ url: coverUrl, title, subtitle: 'Capa do Mundo' }] : []),
    ...cast
      .filter((npc) => npc.avatarUrl || npc.imageUrl)
      .map((npc) => ({
        url: npc.avatarUrl || npc.imageUrl,
        title: npc.name,
        subtitle: npc.description || 'Elenco',
      })),
  ];

  const handleCoverChange = async (newUrl) => {
    if (!onUpdateCover) return;
    setSavingCover(true);
    setCoverError('');
    try {
      await onUpdateCover(world.id, newUrl);
      setEditingCover(false);
    } catch (error) {
      setCoverError(error.message || 'Não foi possível salvar a capa.');
    } finally {
      setSavingCover(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden animate-fadeIn">
      {/* Fundo atmosférico desfocado */}
      {coverUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/90 to-zinc-950 pointer-events-none" />

      {/* Barra superior */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-sm text-zinc-200 active:scale-95"
        >
          <span>←</span>
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditingCover((prev) => !prev)}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-zinc-200 border border-white/10 active:scale-95"
          >
            {editingCover ? 'Fechar Capa' : '🖼️ Capa'}
          </button>

          {onDeleteWorld && (
            <button
              type="button"
              onClick={() => onDeleteWorld(world)}
              className="px-2.5 py-1.5 rounded-full bg-red-950/60 text-xs text-red-300 border border-red-800/40 active:scale-95"
              title="Excluir Mundo"
            >
              🗑️
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo rolável */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 pt-5 pb-28">
        <div className="max-w-lg mx-auto flex flex-col items-center">
          {/* Editor rápido de capa (se ativado) */}
          {editingCover ? (
            <div className="w-48 mb-4">
              <ImagePicker
                value={coverUrl}
                onChange={handleCoverChange}
                aspectClass="aspect-[3/4]"
                placeholder="Cole ou suba capa/GIF"
              />
              {savingCover && (
                <p className="text-center text-xs text-amber-400 mt-1">
                  Salvando capa...
                </p>
              )}
              {coverError && (
                <p className="text-center text-xs text-rose-400 mt-1">
                  {coverError}
                </p>
              )}
            </div>
          ) : (
            /* Pôster principal clicável para Lightbox */
            <div
              onClick={() => {
                if (coverUrl && onOpenLightbox) {
                  onOpenLightbox(lightboxItems, 0);
                }
              }}
              className="relative w-44 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-900 mb-4 cursor-pointer active:scale-95 transition"
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-900/40 via-zinc-900 to-purple-950/40 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-4xl mb-2">{isRpg ? '⚔️' : '🎭'}</span>
                  <span className="text-xs text-zinc-400">
                    Toque em "🖼️ Capa" para adicionar arte ou GIF
                  </span>
                </div>
              )}

              <span
                className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                  isRpg
                    ? 'bg-amber-500/80 text-black'
                    : 'bg-purple-500/80 text-white'
                }`}
              >
                {isRpg ? 'Campanha RPG' : 'Conversa Livre'}
              </span>
            </div>
          )}

          {/* Título e Sinopse */}
          <h1 className="text-2xl font-bold text-center text-white leading-tight">
            {title}
          </h1>

          {world.tagline && (
            <p className="text-xs text-amber-400/90 text-center mt-1 font-medium">
              {world.tagline}
            </p>
          )}

          <p className="mt-4 text-sm text-zinc-300 leading-relaxed text-center whitespace-pre-line bg-white/5 border border-white/10 rounded-2xl p-4 w-full">
            {description}
          </p>

          {/* Carrossel Horizontal do Elenco (Cast) */}
          <section className="w-full mt-6">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Elenco do Mundo ({cast.length})
              </h2>
              {cast.length > 0 && (
                <span className="text-[11px] text-zinc-500">
                  Toque na foto para ampliar
                </span>
              )}
            </div>

            {cast.length === 0 ? (
              <div className="text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 text-center">
                Nenhum NPC fixado neste mundo ainda. Você pode vinculá-los na Biblioteca (Codex).
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {cast.map((npc) => {
                  const npcImg = npc.avatarUrl || npc.imageUrl || '';
                  return (
                    <div
                      key={npc.id}
                      onClick={() => {
                        if (npcImg && onOpenLightbox) {
                          const idx = lightboxItems.findIndex(
                            (item) => item.url === npcImg
                          );
                          onOpenLightbox(lightboxItems, idx >= 0 ? idx : 0);
                        }
                      }}
                      className="snap-start shrink-0 w-24 flex flex-col items-center text-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 cursor-pointer active:scale-95 transition"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border border-white/10 mb-1.5 flex items-center justify-center">
                        {npcImg ? (
                          <img
                            src={npcImg}
                            alt={npc.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-zinc-400">
                            {npc.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-zinc-200 line-clamp-1 w-full">
                        {npc.name}
                      </span>
                      {npc.description && (
                        <span className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-tight">
                          {npc.description}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Botão fixo na base ao alcance do polegar */}
      <footer className="relative z-20 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => onEnterChat(world)}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-base shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <span>▶</span>
            <span>Continuar / Entrar na Cena</span>
          </button>
        </div>
      </footer>
    </div>
  );
}