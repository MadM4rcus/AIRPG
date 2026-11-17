import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Check, Globe } from 'lucide-react';
import { callLLM } from '../services/llmService';
import { WORLD_ARCHITECT_SYSTEM_PROMPT } from '../engine/worldArchitectPrompt';

export default function WorldArchitectChat({ byokConfig, onInstantiateWorld, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'E aí! Sou seu Arquiteto de Mundos. Me conta qual universo ou história você quer criar hoje? Pode ser uma ideia solta, um cenário que você curte ou um tipo de romance/perigo que você quer viver.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [blueprint, setBlueprint] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!byokConfig.isReady) {
      alert('Configure uma chave de API no BYOK antes de criar mundos com a IA.');
      return;
    }

    const userText = input.trim();
    setInput('');
    const updatedMessages = [...messages, { role: 'user', content: userText }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await callLLM({
        messages: updatedMessages,
        systemPrompt: WORLD_ARCHITECT_SYSTEM_PROMPT,
        byokConfig,
      });

      // Checa se a resposta gerou o bloco <world_blueprint>
      const match = response.match(/<world_blueprint>([\s\S]*?)<\/world_blueprint>/i);
      if (match) {
        try {
          const parsed = JSON.parse(match[1].trim());
          setBlueprint(parsed);
        } catch (err) {
          console.warn('Erro ao parsear blueprint JSON:', err);
        }
      }

      const cleanResponse = response.replace(/<world_blueprint>[\s\S]*?<\/world_blueprint>/i, '').trim();
      setMessages([...updatedMessages, { role: 'assistant', content: cleanResponse }]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: `Ops, tive um erro ao processar: ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    if (!blueprint) return;
    onInstantiateWorld(blueprint);
    onClose();
  };

  return (
    <div className="flex flex-col h-[55vh] sm:h-[60vh] bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header interno */}
      <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-zinc-200">Arquiteto de Universos (Chat com IA)</span>
        </div>
        {blueprint && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs shadow-lg shadow-amber-500/20 transition animate-pulse"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instanciar "{blueprint.name}"</span>
          </button>
        )}
      </div>

      {/* Feed do Chat */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 text-xs leading-relaxed ${
              m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                m.role === 'user'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {m.role === 'user' ? '👤' : '✨'}
            </div>
            <div
              className={`rounded-xl p-3 max-w-[85%] whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-amber-600/20 text-zinc-100 border border-amber-500/30'
                  : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 pl-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>O Arquiteto está tecendo as ideias...</span>
          </div>
        )}

        {blueprint && (
          <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 text-xs space-y-2 mt-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <span className="text-base">{blueprint.avatar}</span>
              <span>Mundo Pronto: {blueprint.name}</span>
            </div>
            <p className="text-[11px] text-zinc-300">{blueprint.scenario}</p>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {blueprint.initialVault?.map((v, idx) => (
                <span key={idx} className="bg-amber-900/50 text-amber-300 border border-amber-700/50 px-1.5 py-0.5 rounded font-mono">
                  {v.tag}
                </span>
              ))}
            </div>
            <button
              onClick={handleCreate}
              className="w-full mt-2 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition"
            >
              Jogar neste Mundo Agora
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2 border-t border-zinc-800 bg-zinc-900/50 flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Diga sua ideia (ou peça 'gere o mundo agora!')..."
          disabled={isLoading}
          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
