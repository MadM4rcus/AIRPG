import { useState } from 'react';
import { 
  X, 
  Heart, 
  Swords, 
  Trash2, 
  Download, 
  Upload, 
  Package
} from 'lucide-react';
import { DW_CLASSES } from '../engine/dungeonWorldClasses';

export default function DungeonPaperModal({ 
  isOpen, 
  onClose, 
  sheet, 
  onUpdateHp, 
  onUpdateStatScore, 
  onChangeClass,
  onAddBond,
  onRemoveBond,
  onAddItem,
  onRemoveItem,
  onSaveFullSheet
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'moves' | 'bonds' | 'gear' | 'json'
  const [newBondInput, setNewBondInput] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemWeight, setNewItemWeight] = useState(1);
  const [jsonText, setJsonText] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const currentClassDef = DW_CLASSES[sheet.classId] || DW_CLASSES.guerreiro;
  const currentTotalWeight = (sheet.inventory || []).reduce((acc, it) => acc + (Number(it.weight) || 0), 0);
  const maxLoad = currentClassDef.loadBase + (sheet.stats.FOR?.mod || 0);

  const handleAddBond = (e) => {
    e.preventDefault();
    if (!newBondInput.trim()) return;
    onAddBond(newBondInput.trim());
    setNewBondInput('');
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddItem({
      name: newItemName.trim(),
      weight: Number(newItemWeight) || 0,
      tags: 'Equipamento',
    });
    setNewItemName('');
    setNewItemWeight(1);
  };

  const handleExportJson = () => {
    const exported = JSON.stringify(sheet, null, 2);
    setJsonText(exported);
    navigator.clipboard?.writeText(exported);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleImportJson = () => {
    if (!jsonText.trim()) return;
    try {
      const parsed = JSON.parse(jsonText.trim());
      if (!parsed || typeof parsed !== 'object' || !parsed.name || !parsed.stats || !parsed.stats.FOR) {
        throw new Error('Estrutura de ficha inválida. Certifique-se de incluir "name" e "stats" (FOR, DES, CON, INT, SAB, CAR).');
      }
      onSaveFullSheet({
        ...sheet,
        ...parsed,
        bonds: Array.isArray(parsed.bonds) ? parsed.bonds : [],
        inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      });
      alert('Ficha Dungeon Paper importada com sucesso!');
    } catch (err) {
      alert('Erro ao importar JSON: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-2xl bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Header estilo Dungeon Paper */}
        <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-black text-sm">
              DP
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>{sheet.name}</span>
                <span className="text-[10px] text-zinc-400 font-normal">Nível {sheet.level || 1}</span>
              </h2>
              <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">
                {currentClassDef.name} • Dano {sheet.damageDice}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Principais de Navegação */}
        <div className="flex overflow-x-auto gap-1 p-2 bg-zinc-950/90 border-b border-zinc-800 text-xs shrink-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 px-3 rounded text-center whitespace-nowrap font-medium transition ${
              activeTab === 'overview' ? 'bg-rose-600 text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Atributos & PV
          </button>
          <button
            onClick={() => setActiveTab('moves')}
            className={`py-1.5 px-3 rounded text-center whitespace-nowrap font-medium transition ${
              activeTab === 'moves' ? 'bg-rose-600 text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Movimentos ({currentClassDef.startingMoves.length})
          </button>
          <button
            onClick={() => setActiveTab('bonds')}
            className={`py-1.5 px-3 rounded text-center whitespace-nowrap font-medium transition ${
              activeTab === 'bonds' ? 'bg-rose-600 text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Vínculos ({sheet.bonds?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('gear')}
            className={`py-1.5 px-3 rounded text-center whitespace-nowrap font-medium transition ${
              activeTab === 'gear' ? 'bg-rose-600 text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Carga ({currentTotalWeight}/{maxLoad})
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-1.5 px-3 rounded text-center whitespace-nowrap font-medium transition ${
              activeTab === 'json' ? 'bg-rose-600 text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Exportar / JSON
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* ============================================================== */}
          {/* ABA 1: VISÃO GERAL (PV + ATRIBUTOS DUNGEON PAPER)              */}
          {/* ============================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Seletor de Classe / Playbook */}
              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Playbook / Classe do Herói:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(DW_CLASSES).map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => onChangeClass(cls.id)}
                      className={`p-2 rounded-lg border text-center transition ${
                        sheet.classId === cls.id
                          ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <p className="text-xs">{cls.name}</p>
                      <span className="text-[9px] text-zinc-500">Dano {cls.damageDice}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Barra Grande de Pontos de Vida (PV) */}
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    <div>
                      <span className="text-xs font-bold text-zinc-100">Pontos de Vida</span>
                      <p className="text-[10px] text-zinc-400">Base {currentClassDef.baseHp} + CON ({sheet.stats.CON?.value})</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-2xl font-black text-rose-400">{sheet.hp}</span>
                    <span className="text-xs text-zinc-500">/ {sheet.maxHp}</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="bg-rose-600 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, (sheet.hp / sheet.maxHp) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1 pt-1">
                  <button
                    onClick={() => onUpdateHp(-5)}
                    className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-rose-400 font-bold text-xs border border-zinc-800 rounded-lg"
                  >
                    -5 PV
                  </button>
                  <button
                    onClick={() => onUpdateHp(-1)}
                    className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-rose-400 font-bold text-xs border border-zinc-800 rounded-lg"
                  >
                    -1 PV
                  </button>
                  <button
                    onClick={() => onUpdateHp(+1)}
                    className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 font-bold text-xs border border-zinc-800 rounded-lg"
                  >
                    +1 PV
                  </button>
                  <button
                    onClick={() => onUpdateHp(+5)}
                    className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 font-bold text-xs border border-zinc-800 rounded-lg"
                  >
                    +5 PV
                  </button>
                </div>
              </div>

              {/* Atributos em Grid estilo Dungeon Paper (Scores 1-18 com Modificadores -3 a +3) */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Atributos (Valor de 1 a 18 & Modificador)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(sheet.stats).map(([statName, data]) => (
                    <div 
                      key={statName}
                      className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-zinc-300">{statName}</span>
                        <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                          data.mod >= 0 
                            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400' 
                            : 'bg-rose-950/60 border-rose-800/80 text-rose-400'
                        }`}>
                          {data.mod >= 0 ? `+${data.mod}` : data.mod}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 font-medium">Pontuação:</span>
                        <input
                          type="number"
                          min="1"
                          max="18"
                          value={data.value}
                          onChange={(e) => onUpdateStatScore(statName, e.target.value)}
                          className="w-12 text-center bg-zinc-900 border border-zinc-700 rounded text-xs font-bold text-zinc-200 py-0.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ABA 2: MOVIMENTOS DE CLASSE (PLAYBOOK)                          */}
          {/* ============================================================== */}
          {activeTab === 'moves' && (
            <div className="space-y-3">
              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800 text-[11px] text-zinc-400">
                Poderes e movimentos especiais concedidos pelo Playbook de <strong>{currentClassDef.name}</strong>:
              </div>

              {currentClassDef.startingMoves.map((m, idx) => (
                <div key={idx} className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    <h4 className="font-bold text-xs text-zinc-200">{m.name}</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pl-5">
                    {m.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ============================================================== */}
          {/* ABA 3: VÍNCULOS (BONDS)                                         */}
          {/* ============================================================== */}
          {activeTab === 'bonds' && (
            <div className="space-y-4">
              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800 text-[11px] text-zinc-400">
                Os <strong>Vínculos</strong> definem sua relação dramática com os companheiros e NPCs. Eles são lidos pelo Pescador do Vault durante o roleplay.
              </div>

              {/* Form Novo Vínculo */}
              <form onSubmit={handleAddBond} className="flex gap-2">
                <input
                  type="text"
                  value={newBondInput}
                  onChange={(e) => setNewBondInput(e.target.value)}
                  placeholder="Ex: Não confio nas promessas da Valéria sobre as ruínas..."
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-3.5 bg-rose-600 hover:bg-rose-500 text-zinc-100 font-bold text-xs rounded-xl transition shrink-0"
                >
                  Adicionar
                </button>
              </form>

              {/* Lista de Vínculos */}
              <div className="space-y-2">
                {(sheet.bonds || []).map((bond, idx) => (
                  <div key={idx} className="group bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                      <p className="text-xs text-zinc-300 leading-relaxed">{bond}</p>
                    </div>
                    <button
                      onClick={() => onRemoveBond(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                      title="Excluir vínculo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ABA 4: CARGA & EQUIPAMENTOS                                    */}
          {/* ============================================================== */}
          {activeTab === 'gear' && (
            <div className="space-y-4">
              {/* Barra de Carga */}
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-200">Carga do Personagem</span>
                  <p className="text-[10px] text-zinc-400">Base {currentClassDef.loadBase} + FOR ({sheet.stats.FOR?.mod})</p>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className={`text-lg font-black ${currentTotalWeight > maxLoad ? 'text-rose-400' : 'text-amber-400'}`}>
                    {currentTotalWeight}
                  </span>
                  <span className="text-xs text-zinc-500">/ {maxLoad} Peso</span>
                </div>
              </div>

              {/* Form Adicionar Item */}
              <form onSubmit={handleAddItem} className="flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nome do item..."
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={newItemWeight}
                  onChange={(e) => setNewItemWeight(e.target.value)}
                  className="w-16 bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-2 text-xs text-zinc-100 text-center"
                  title="Peso"
                />
                <button
                  type="submit"
                  className="px-3 bg-rose-600 hover:bg-rose-500 text-zinc-100 font-bold text-xs rounded-xl transition shrink-0"
                >
                  Adicionar
                </button>
              </form>

              {/* Lista de Itens */}
              <div className="space-y-1.5">
                {(sheet.inventory || []).map((item, idx) => (
                  <div key={idx} className="group bg-zinc-950/70 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-medium text-zinc-200">{item.name}</span>
                      {item.tags && (
                        <span className="text-[10px] text-zinc-500 italic">({item.tags})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        {item.weight || 1} peso
                      </span>
                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ABA 5: JSON & IMPORTADOR/EXPORTADOR                            */}
          {/* ============================================================== */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={handleExportJson}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>{copiedJson ? 'Copiado para Clipboard!' : 'Exportar Ficha (JSON)'}</span>
                </button>
                <button
                  onClick={handleImportJson}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-zinc-100 font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Carregar do JSON Abaixo</span>
                </button>
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Cole aqui o JSON da ficha do Dungeon Paper para importar..."
                rows={10}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 font-mono text-[10px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}