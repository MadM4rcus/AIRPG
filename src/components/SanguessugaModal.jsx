import { useState } from 'react';
import { 
  X, 
  Upload, 
  Sparkles,
  Globe,
  Plus, 
  Copy, 
  Check, 
  User
} from 'lucide-react';
import { 
  parseCharacterCardJSON, 
  parseRawTextProfile, 
  SANGUESSUGA_BOOKMARKLET_CODE 
} from '../engine/cardParser';
import WorldArchitectChat from './WorldArchitectChat';

export default function SanguessugaModal({ 
  isOpen, 
  onClose, 
  onAddProfile, 
  userPersona, 
  onSaveUserPersona,
  byokConfig
}) {
  const [activeTab, setActiveTab] = useState('architect'); // 'architect' | 'import' | 'manual' | 'persona' | 'bookmarklet'
  const [rawText, setRawText] = useState('');
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  // Formulário manual
  const [formData, setFormData] = useState({
    name: '',
    avatar: '🎭',
    tag: 'Custom',
    personality: '',
    scenario: '',
    firstMessage: '',
  });

  // Formulário User Persona
  const [personaData, setPersonaData] = useState(userPersona);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCharacterCardJSON(text);
        onAddProfile(parsed);
        onClose();
      } catch (err) {
        alert('Erro ao processar arquivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleRawImport = () => {
    if (!rawText.trim()) return;
    try {
      let parsed;
      if (rawText.trim().startsWith('{')) {
        parsed = parseCharacterCardJSON(rawText.trim());
      } else {
        parsed = parseRawTextProfile(rawText.trim());
      }
      onAddProfile(parsed);
      onClose();
    } catch (err) {
      alert('Erro na importação: ' + err.message);
    }
  };

  const handleCreateManual = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onAddProfile(formData);
    onClose();
  };

  const handleSavePersona = (e) => {
    e.preventDefault();
    onSaveUserPersona(personaData);
    alert('User Persona salva com sucesso!');
  };

  const copyBookmarklet = () => {
    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(SANGUESSUGA_BOOKMARKLET_CODE)
        .then(() => {
          setCopiedBookmarklet(true);
          setTimeout(() => setCopiedBookmarklet(false), 2000);
        })
        .catch(() => fallbackCopy());
      return;
    }
    fallbackCopy();

    function fallbackCopy() {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = SANGUESSUGA_BOOKMARKLET_CODE;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (success) {
          setCopiedBookmarklet(true);
          setTimeout(() => setCopiedBookmarklet(false), 2000);
        }
      } catch (e) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 select-none">
      <div className="w-full sm:max-w-xl bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Galeria & Criação de Mundos</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas com rolagem suave no mobile */}
        <div className="flex overflow-x-auto gap-1 p-2 bg-zinc-950/80 border-b border-zinc-800 text-xs shrink-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('architect')}
            className={`py-1.5 px-3 rounded text-center whitespace-nowrap font-medium transition flex items-center gap-1.5 ${
              activeTab === 'architect' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Arquiteto de Mundos</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-1.5 px-3 rounded text-center whitespace-nowrap font-medium transition ${
              activeTab === 'import' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sanguessuga
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-1.5 px-3 rounded text-center whitespace-nowrap font-medium transition ${
              activeTab === 'manual' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Criar Manual
          </button>
          <button
            onClick={() => setActiveTab('persona')}
            className={`py-1.5 px-3 rounded text-center whitespace-nowrap font-medium transition ${
              activeTab === 'persona' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Minha Persona
          </button>
          <button
            onClick={() => setActiveTab('bookmarklet')}
            className={`py-1.5 px-3 rounded text-center whitespace-nowrap font-medium transition ${
              activeTab === 'bookmarklet' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Bookmarklet
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* ABA 0: ARQUITETO DE MUNDOS (ASSISTENTE COM IA) */}
          {activeTab === 'architect' && (
            <div className="space-y-3">
              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Crie universos, múltiplos NPCs e lore para o Vault conversando com a IA.</span>
                <span className="text-amber-400 font-mono text-[10px]">Modo Freeroam</span>
              </div>
              <WorldArchitectChat
                byokConfig={byokConfig}
                onInstantiateWorld={onAddProfile}
                onClose={onClose}
              />
            </div>
          )}

          {/* ABA 1: SANGUESSUGA (IMPORTADOR UNIVERSAL) */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-xl p-5 text-center bg-zinc-950/40 transition">
                <input
                  type="file"
                  id="card-upload"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="card-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-amber-400" />
                  <span className="text-xs font-semibold text-zinc-200">
                    Carregar Character Card (.json)
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Suporte a Chub, SillyTavern, Jan e Venus V2
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Ou Cole Texto / JSON de Sites Externos:</span>
                  <span className="text-[10px] text-amber-400">SpicyChat / c.ai / etc</span>
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Cole aqui o texto copiado da página ou o JSON..."
                  rows={6}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  onClick={handleRawImport}
                  disabled={!rawText.trim()}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  Sugar e Criar Personagem
                </button>
              </div>
            </div>
          )}

          {/* ABA 2: CRIAR MANUAL */}
          {activeTab === 'manual' && (
            <form onSubmit={handleCreateManual} className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Avatar</label>
                  <input
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full text-center bg-zinc-950 border border-zinc-700 rounded-lg py-2 text-base"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Nome do Personagem</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Morgana, A Feiticeira"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Personalidade e Traços</label>
                <textarea
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  rows={3}
                  placeholder="Comportamento, manias, segredos..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Cenário Inicial</label>
                <input
                  type="text"
                  value={formData.scenario}
                  onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                  placeholder="Local, clima e atmosfera da cena..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Primeira Mensagem</label>
                <textarea
                  value={formData.firstMessage}
                  onChange={(e) => setFormData({ ...formData, firstMessage: e.target.value })}
                  rows={3}
                  placeholder="A fala que o bot dirá ao iniciar a conversa..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold transition"
              >
                Salvar Perfil
              </button>
            </form>
          )}

          {/* ABA 3: USER PERSONA */}
          {activeTab === 'persona' && (
            <form onSubmit={handleSavePersona} className="space-y-3">
              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800 text-[11px] text-zinc-400">
                Esta é a sua identidade na narrativa. A IA usará essas informações para se referir a você e saber como você se parece.
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Seu Nome / Apelido</label>
                <input
                  type="text"
                  value={personaData.name}
                  onChange={(e) => setPersonaData({ ...personaData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Sua Aparência e Vestimentas</label>
                <input
                  type="text"
                  value={personaData.appearance}
                  onChange={(e) => setPersonaData({ ...personaData, appearance: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400">Descrição e Fatos sobre Você</label>
                <textarea
                  value={personaData.description}
                  onChange={(e) => setPersonaData({ ...personaData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold transition"
              >
                Atualizar Minha Persona
              </button>
            </form>
          )}

          {/* ABA 4: BOOKMARKLET SANGUESSUGA */}
          {activeTab === 'bookmarklet' && (
            <div className="space-y-3 text-xs text-zinc-300">
              <p className="leading-relaxed">
                O <strong>Bookmarklet Sanguessuga</strong> extrai as informações de um bot em sites abertos com 1 clique no navegador do celular ou PC.
              </p>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Código do Bookmarklet:</span>
                <button
                  type="button"
                  onClick={copyBookmarklet}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-amber-300 font-mono transition"
                >
                  {copiedBookmarklet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedBookmarklet ? 'Código Copiado!' : 'Copiar Código JavaScript'}</span>
                </button>

                <div className="pt-2">
                  <span className="text-[10px] text-zinc-500">Ou selecione o código abaixo manualmente:</span>
                  <textarea
                    readOnly
                    value={SANGUESSUGA_BOOKMARKLET_CODE}
                    onClick={(e) => e.target.select()}
                    rows={4}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 font-mono text-[10px] text-zinc-300 select-all"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
