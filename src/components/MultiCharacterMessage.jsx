import React, { useMemo } from 'react';

/**
 * Quebra uma mensagem da IA em segmentos de Narração e Falas de Personagens
 * sempre que encontra padrões como:
 * **[Victoria]:** texto...
 * **Victoria:** texto...
 * [Victoria]: texto...
 */
function parseMessageSegments(rawText, cast = []) {
  if (!rawText || typeof rawText !== 'string') return [];

  // Mapa case-insensitive dos NPCs conhecidos para vincular avatar e nome oficial
  const castMap = new Map();
  cast.forEach((npc) => {
    if (npc?.name) {
      castMap.set(npc.name.trim().toLowerCase(), npc);
    }
  });

  // Regex captura linhas que iniciam com **[Nome]:**, **Nome:** ou [Nome]:
  const speakerRegex = /^(?:\*\*\[?([^\]\n:*]+)\]?:\*\*|\[([^\]\n:]+)\]:)\s*(.*)$/;
  const lines = rawText.split('\n');
  const segments = [];
  let currentSegment = null;

  const pushCurrent = () => {
    if (currentSegment && currentSegment.content.trim()) {
      segments.push({
        ...currentSegment,
        content: currentSegment.content.trim(),
      });
    }
    currentSegment = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(speakerRegex);

    if (match) {
      const rawSpeaker = (match[1] || match[2] || '').trim();
      const remainder = (match[3] || '').trim();
      const lowerSpeaker = rawSpeaker.toLowerCase();

      // Ignora rótulos genéricos de narração, tratando-os como bloco narrativo
      if (['narrador', 'narrator', 'cena', 'scene', 'mestre', 'gm'].includes(lowerSpeaker)) {
        pushCurrent();
        currentSegment = {
          type: 'narration',
          speaker: null,
          npc: null,
          content: remainder,
        };
      } else {
        pushCurrent();
        // Tenta encontrar o NPC exato ou por primeiro nome no elenco
        let matchedNpc = castMap.get(lowerSpeaker) || null;
        if (!matchedNpc) {
          for (const [key, npcObj] of castMap.entries()) {
            if (key.startsWith(lowerSpeaker + ' ') || lowerSpeaker.startsWith(key + ' ')) {
              matchedNpc = npcObj;
              break;
            }
          }
        }

        currentSegment = {
          type: 'character',
          speaker: matchedNpc?.name || rawSpeaker,
          npc: matchedNpc,
          content: remainder,
        };
      }
    } else {
      if (!currentSegment) {
        currentSegment = {
          type: 'narration',
          speaker: null,
          npc: null,
          content: line,
        };
      } else {
        currentSegment.content += '\n' + line;
      }
    }
  }

  pushCurrent();
  return segments;
}

/**
 * Formata itálicos (*ação*) e negritos (**ênfase**) dentro de um parágrafo
 */
function FormattedText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={i} className="italic text-zinc-400">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

export default function MultiCharacterMessage({
  content,
  cast = [],
  fallbackAvatar = '',
  fallbackName = '',
  onOpenLightbox,
}) {
  const segments = useMemo(() => parseMessageSegments(content, cast), [content, cast]);

  // Se não houve separação multi-personagem, renderiza como bolha única padrão
  const hasMultipleSpeakers =
    segments.length > 1 || segments.some((s) => s.type === 'character');

  if (!hasMultipleSpeakers) {
    return (
      <div className="text-sm sm:text-[15px] text-zinc-200 leading-relaxed whitespace-pre-line">
        <FormattedText text={content} />
      </div>
    );
  }

  // Galeria de retratos do elenco para o Lightbox ao tocar no avatar da bolha
  const castGallery = cast
    .filter((n) => n.avatarUrl || n.imageUrl)
    .map((n) => ({
      url: n.avatarUrl || n.imageUrl,
      title: n.name,
      subtitle: n.description || 'Elenco',
    }));

  const handleAvatarClick = (npc, speakerName, avatarUrl) => {
    if (!avatarUrl || !onOpenLightbox) return;
    if (castGallery.length > 0) {
      const idx = castGallery.findIndex((item) => item.url === avatarUrl);
      onOpenLightbox(
        idx >= 0 ? castGallery : [{ url: avatarUrl, title: speakerName }],
        idx >= 0 ? idx : 0
      );
    } else {
      onOpenLightbox([{ url: avatarUrl, title: speakerName }], 0);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {segments.map((seg, index) => {
        if (seg.type === 'narration') {
          return (
            <div
              key={index}
              className="px-3 py-2 rounded-xl bg-white/[0.03] border-l-2 border-amber-500/40 text-xs sm:text-sm text-zinc-300 italic leading-relaxed whitespace-pre-line"
            >
              <FormattedText text={seg.content} />
            </div>
          );
        }

        const avatarUrl =
          seg.npc?.avatarUrl || seg.npc?.imageUrl || fallbackAvatar || '';
        const displayName = seg.speaker || fallbackName || 'Personagem';

        return (
          <div
            key={index}
            className="flex items-start gap-2.5 bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-3 shadow-sm"
          >
            {/* Avatar clicável do personagem que está falando */}
            <button
              type="button"
              onClick={() => handleAvatarClick(seg.npc, displayName, avatarUrl)}
              disabled={!avatarUrl}
              className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center active:scale-90 transition"
              title={avatarUrl ? `Ampliar retrato de ${displayName}` : displayName}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-amber-400">
                  {displayName[0]?.toUpperCase() || '?'}
                </span>
              )}
            </button>

            {/* Nome + Fala/Ação curta do personagem */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-amber-400 tracking-wide">
                  {displayName}
                </span>
              </div>
              <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                <FormattedText text={seg.content} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}