import { useState } from 'react';
import { AlertTriangle, Server, Terminal, Settings, Key, RefreshCw, Copy, Check } from 'lucide-react';

export function SetupWarningScreen() {
  const [activeTab, setActiveTab] = useState<'vercel' | 'local'>('vercel');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Missing Supabase Credentials
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              The application could not initialize because the Supabase Project ID or Anon Key is not configured in your environment.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-indigo-400" /> Required Variables
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/60 rounded-xl px-3.5 py-2.5">
              <span className="font-mono text-xs text-indigo-300 font-semibold select-text">VITE_SUPABASE_PROJECT_ID</span>
              <button 
                onClick={() => handleCopy('VITE_SUPABASE_PROJECT_ID', 'projectId')}
                className="text-slate-400 hover:text-white transition-colors"
                title="Copy variable name"
              >
                {copiedKey === 'projectId' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/60 rounded-xl px-3.5 py-2.5">
              <span className="font-mono text-xs text-indigo-300 font-semibold select-text">VITE_SUPABASE_ANON_KEY</span>
              <button 
                onClick={() => handleCopy('VITE_SUPABASE_ANON_KEY', 'anonKey')}
                className="text-slate-400 hover:text-white transition-colors"
                title="Copy variable name"
              >
                {copiedKey === 'anonKey' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Guide Tabs */}
        <div className="flex flex-col gap-4">
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('vercel')}
              className={`pb-2 px-4 font-semibold text-sm transition-colors relative ${
                activeTab === 'vercel' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4" /> Vercel Setup Guide
              </span>
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`pb-2 px-4 font-semibold text-sm transition-colors relative ${
                activeTab === 'local' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Local Setup (.env)
              </span>
            </button>
          </div>

          <div className="min-h-[160px] text-sm text-slate-300 leading-relaxed">
            {activeTab === 'vercel' ? (
              <ol className="list-decimal list-inside flex flex-col gap-3 pl-1">
                <li>
                  Open your <strong className="text-white">Vercel Dashboard</strong> and navigate to this project.
                </li>
                <li>
                  Go to <strong className="text-white">Settings</strong> &rarr; <strong className="text-white">Environment Variables</strong>.
                </li>
                <li>
                  Add <strong className="text-indigo-400">VITE_SUPABASE_PROJECT_ID</strong> and copy-paste your Supabase project's ID.
                </li>
                <li>
                  Add <strong className="text-indigo-400">VITE_SUPABASE_ANON_KEY</strong> and copy-paste your Supabase public anon key.
                </li>
                <li>
                  Go to the <strong className="text-white">Deployments</strong> tab, find your latest build, click the three dots, and choose <strong className="text-indigo-400">Redeploy</strong> to apply the changes.
                </li>
              </ol>
            ) : (
              <div className="flex flex-col gap-3">
                <p>To configure your local development environment:</p>
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-400 select-text">
                  <span className="text-slate-600"># Copy the example env template</span>
                  <br />
                  cp .env.example .env.local
                  <br />
                  <br />
                  <span className="text-slate-600"># Edit .env.local to include your keys:</span>
                  <br />
                  VITE_SUPABASE_PROJECT_ID=your_actual_project_id
                  <br />
                  VITE_SUPABASE_ANON_KEY=your_actual_anon_key
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-800 pt-5 mt-2">
          <span className="text-xs text-slate-500">
            Need help? Check your Supabase settings dashboard.
          </span>
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
            Check Connection & Reload
          </button>
        </div>

      </div>
    </div>
  );
}
