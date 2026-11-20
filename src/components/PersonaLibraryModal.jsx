import React, { useState } from 'react';
import {
  X,
  User,
  Plus,
  Check,
  Trash2,
  Edit3,
} from 'lucide-react';

export default function PersonaLibraryModal({
  isOpen,
  onClose,
  personas = [],
  activePersonaId,
  onSelectPersona,
  onSavePersona,
  onDeletePersona,
}) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🧑');
  const [appearance, setAppearance] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAvatar('🧑');
    setAppearance('');
    setDescription('');
  };

  const handleEditClick = (p) => {
    setEditingId(p.id);
    setName(p.name || '');
    setAvatar(p.avatar || '🧑');
    setAppearance(p.appearance || '');
    setDescription(p.description || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSavePersona({
      id: editingId || undefined,
      name,
      avatar,
      appearance,
      description,
    });
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Biblioteca de Personas
              </h2>
              <p className="text-xs text-zinc-400">
                Alterne rapidamente entre seus personagens em qualquer conversa ou campanha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Lista de Personas Cadastradas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {personas.map((p) => {
              const isActive = p.id === activePersonaId;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPersona(p.id)}
                  className={`cursor-pointer p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg shrink-0">
                        {p.avatar || '🧑'}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-zinc-100 truncate">
                          {p.name}
                        </h3>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                            <Check className="w-3 h-3" /> Persona Ativa
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleEditClick(p)}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-amber-300 hover:bg-zinc-800"
                        title="Editar Persona"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {personas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeletePersona(p.id)}
                          className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Excluir Persona"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {p.appearance && (
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      <strong className="text-zinc-300">Aparência:</strong>{' '}
                      {p.appearance}
                    </p>
                  )}
                  {p.description && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2">
                      {p.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Formulário Criar / Editar Persona */}
          <form
            onSubmit={handleSubmit}
            className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                {editingId ? 'Editar Persona' : '+ Nova Persona'}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar edição
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Nome (ex: Kael, o Caçador)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                required
              />
              <input
                type="text"
                placeholder="Emoji"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-center text-zinc-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <input
              type="text"
              placeholder="Aparência curta (ex: Cicatriz no queixo, casaco gasto, olhos cinzentos)"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />

            <textarea
              rows={2}
              placeholder="Personalidade, estilo de fala e histórico breve (1-2 frases para economizar tokens)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {editingId ? 'Atualizar Persona' : 'Adicionar Persona'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}