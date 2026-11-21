import React, { useRef, useState } from 'react';
import { uploadBlobToImgbb, importImageFromUrl } from '../services/imageUploadService';

export default function ImagePicker({
  value,
  onChange,
  aspectClass = 'aspect-[3/4]',
  placeholder = 'Capa ou GIF',
  compact = false,
}) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const hostedUrl = await uploadBlobToImgbb(file);
      onChange(hostedUrl);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (raw) => {
    const target = (raw ?? urlInput).trim();
    if (!target) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const hostedUrl = await importImageFromUrl(target);
      onChange(hostedUrl);
      setUrlInput('');
      setShowUrlField(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lê direto da área de transferência do celular (link ou imagem copiada)
  const handleClipboardPaste = async () => {
    setErrorMsg('');
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            await handleFile(blob);
            return;
          }
        }
      }
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().startsWith('http')) {
          await handleUrlSubmit(text.trim());
          return;
        }
      }
      setShowUrlField(true);
      setErrorMsg('Cole o link no campo abaixo.');
    } catch {
      // Navegador bloqueou leitura automática -> abre o campo nativo para colar com o dedo
      setShowUrlField(true);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div
        className={`relative w-full ${aspectClass} rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/90 flex items-center justify-center group`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900/90 text-xs text-white border border-zinc-700 active:scale-95"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2.5 py-1.5 rounded-lg bg-red-950/90 text-xs text-red-200 border border-red-800/60 active:scale-95"
              >
                Remover
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-3 text-center gap-2">
            <span className="text-2xl">🖼️</span>
            {!compact && (
              <span className="text-xs text-zinc-400 leading-tight">
                {placeholder}
              </span>
            )}
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-amber-400 font-medium">Enviando...</span>
          </div>
        )}
      </div>

      {/* Botões rápidos otimizados para o polegar no mobile */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={loading}
          onClick={handleClipboardPaste}
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-medium active:scale-95 transition"
        >
          <span>📋</span>
          <span>Colar</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium active:scale-95 transition"
        >
          <span>📁</span>
          <span>Galeria</span>
        </button>
      </div>

      {showUrlField && (
        <div className="flex gap-1.5">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Cole https://... (imagem ou GIF)"
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            disabled={loading || !urlInput.trim()}
            onClick={() => handleUrlSubmit()}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-xs disabled:opacity-40"
          >
            OK
          </button>
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] text-red-400 leading-tight">{errorMsg}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}