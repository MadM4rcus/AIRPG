import React, { useState } from 'react';
import {
  X,
  BookOpen,
  User,
  MapPin,
  Globe,
  Plus,
  Trash2,
  Pin,
  Search,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'NPC', label: 'NPC', icon: User, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'LOCAL', label: 'Local', icon: MapPin, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'MUNDO', label: 'Regra de Mundo', icon: Globe, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
];

export default function CodexModal({
  isOpen,
  onClose,
  codex = [],
  onAddEntry,
  onDeleteEntry,
  pinnedIds = [],
  onTogglePin,
  activeSessionName = '',
}) {
  const [filterCat, setFilterCat] = useState('ALL');
  const [search, setSearch] = useState('');

  // Formulário de criação rápida
  const [category, setCategory] = useState('NPC');
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [summary, setSummary] = useState('');

  if (!isOpen) return null;

  const pinnedSet = new Set(pinnedIds || []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim() || !summary.trim()) return;
    onAddEntry({ category, name, tag, summary });
    setName('');
    setTag('');
    setSummary('');
  };

  const filteredList = codex.filter((item) => {
    const matchesCat = filterCat === 'ALL' || item.category === filterCat;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item.name || '').toLowerCase().includes(q) ||
      (item.tag || '').toLowerCase().includes(q) ||
      (item.summary || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Biblioteca Compartilhada (Codex)
              </h2>
              <p className="text-xs text-zinc-400">
                NPCs, Locais e Regras de Mundo reutilizáveis em Conversas Livres e Campanhas RPG
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Formulário de Nova Entrada */}
          <form
            onSubmit={handleCreate}
            className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                + Novo Registro na Biblioteca
              </span>
              <div className="flex gap-1.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        active
                          ? cat.color
                          : 'text-zinc-400 bg-zinc-900 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                placeholder={
                  category === 'NPC'
                    ? 'Nome (ex: Lyra, a Alquimista)'
                    : category === 'LOCAL'
                    ? 'Local (ex: Mercado Subterrâneo)'
                    : 'Regra (ex: Lei do Sangue)'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="sm:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                required
              />
              <input
                type="text"
                placeholder="#Tag (opcional)"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <textarea
                rows={2}
                placeholder={
                  category === 'NPC'
                    ? 'Resumo curto: aparência, personalidade, manias e limites (1-2 frases para economizar tokens)...'
                    : category === 'LOCAL'
                    ? 'Resumo curto: atmosfera, perigos, quem frequenta e regras do lugar...'
                    : 'Resumo curto: como essa regra funciona no mundo e suas consequências...'
                }
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </form>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterCat('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  filterCat === 'ALL'
                    ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                Todos ({codex.length})
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCat(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filterCat === cat.id
                      ? cat.color
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {cat.label} ({codex.filter((c) => c.category === cat.id).length})
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar nome ou #tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* Lista de Registros */}
          {filteredList.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
              Nenhum registro encontrado nesta categoria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredList.map((item) => {
                const catMeta =
                  CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
                const Icon = catMeta.icon;
                const isPinned = pinnedSet.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                      isPinned
                        ? 'bg-amber-500/5 border-amber-500/40'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border shrink-0 ${catMeta.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {catMeta.label}
                          </span>
                          <h3 className="text-sm font-semibold text-zinc-100 truncate">
                            {item.name}
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                      {onTogglePin ? (
                        <button
                          type="button"
                          onClick={() => onTogglePin(item.id)}
                          title="Fixar este item para estar sempre ativo na sessão atual"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            isPinned
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                          {isPinned
                            ? `Fixado${activeSessionName ? ` em ${activeSessionName}` : ''}`
                            : 'Fixar nesta cena'}
                        </button>
                      ) : (
                        <span />
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteEntry(item.id)}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Excluir da biblioteca"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}