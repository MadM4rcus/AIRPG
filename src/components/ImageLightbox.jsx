import React, { useRef } from 'react';

export default function ImageLightbox({
  items = [], // [{ url, title, subtitle }]
  currentIndex = 0,
  isOpen = false,
  onClose,
  onNavigate,
}) {
  const touchStartX = useRef(null);

  if (!isOpen || !items.length) return null;

  const safeIndex = Math.max(0, Math.min(currentIndex, items.length - 1));
  const current = items[safeIndex];
  const hasMultiple = items.length > 1;

  const goPrev = (e) => {
    e?.stopPropagation();
    if (!hasMultiple) return;
    onNavigate((safeIndex - 1 + items.length) % items.length);
  };

  const goNext = (e) => {
    e?.stopPropagation();
    if (!hasMultiple) return;
    onNavigate((safeIndex + 1) % items.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  return (
    <div
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-fadeIn"
    >
      {/* Topo com título e botão fechar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg flex items-center justify-between mb-3 px-1"
      >
        <div className="min-w-0">
          {current.title && (
            <h3 className="text-white font-semibold text-base truncate">
              {current.title}
            </h3>
          )}
          {current.subtitle && (
            <p className="text-xs text-zinc-400 truncate">{current.subtitle}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-zinc-800/90 text-zinc-200 flex items-center justify-center text-lg border border-zinc-700 active:scale-90"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      {/* Imagem ou GIF animado em alta */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full max-h-[75vh] flex items-center justify-center"
      >
        <img
          src={current.url}
          alt={current.title || 'Imagem'}
          className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-zinc-800"
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 w-10 h-10 rounded-full bg-black/70 text-white border border-white/15 flex items-center justify-center active:scale-90"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 w-10 h-10 rounded-full bg-black/70 text-white border border-white/15 flex items-center justify-center active:scale-90"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Indicador de paginação */}
      {hasMultiple && (
        <div className="mt-3 text-xs text-zinc-400">
          {safeIndex + 1} / {items.length} • deslize para trocar
        </div>
      )}
    </div>
  );
}