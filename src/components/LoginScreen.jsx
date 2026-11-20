import { useState } from 'react';
import { Sparkles, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { loginWithGoogle } from '../services/firebase';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Erro no login Google:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelado. Clique novamente para entrar com sua conta Google.');
      } else {
        setError(err.message || 'Falha ao conectar com o Google.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl shadow-lg shadow-amber-500/10">
            AI
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-wide text-zinc-100">AIRPG</h1>
            <p className="text-xs text-zinc-400">
              Dual-Mode Roleplay & Hardcore PbtA Engine
            </p>
          </div>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 space-y-2 text-xs text-zinc-300">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Sua conta, seus mundos e suas chaves</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Entre com seu Gmail para sincronizar automaticamente seus personagens, histórico de campanhas, ficha e chaves de API (BYOK) em qualquer dispositivo.
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-600/50 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Conectando ao Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              <span>Entrar com Google (Gmail)</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Dados isolados por usuário via Firebase Auth</span>
        </div>
      </div>
    </div>
  );
}