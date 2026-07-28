import React, { useState } from 'react';
import { X, Settings, Key, Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchPortfolioAnalytics } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  customApiKey,
  onSaveApiKey,
}) => {
  const [keyInput, setKeyInput] = useState(customApiKey);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Checking connection to IntoAEC Autopilot…');
    try {
      const data = await fetchPortfolioAnalytics(14, true, true, keyInput.trim() || undefined);
      if (data?.summary) {
        setTestStatus('success');
        setTestMessage(`Connected! Found health data for ${data.summary.totalAccounts} account(s).`);
      } else {
        setTestStatus('failed');
        setTestMessage('Connected, but no portfolio data came back yet.');
      }
    } catch (err) {
      setTestStatus('failed');
      setTestMessage(`Connection failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border p-6 bg-white border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl border border-slate-100 bg-sky-50">
              <Settings className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Connection settings</h3>
              <p className="text-xs text-slate-500 font-medium">Usually leave this alone — defaults work for CS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Override API key <span className="text-slate-500 font-normal normal-case">(optional)</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Leave blank to use the server default"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-400 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Only needed if your admin gave you a different key. Most CS teammates can ignore this.
            </p>
          </div>

          {testStatus !== 'idle' && (
            <div className="p-3 rounded-xl border text-xs flex items-start gap-2 animate-fade-in"
              style={testStatus === 'testing'
                ? { background: 'rgba(14,165,233,0.06)', borderColor: 'rgba(14,165,233,0.18)', color: '#0284c7' }
                : testStatus === 'success'
                ? { background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.18)', color: '#047857' }
                : { background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.18)', color: '#b91c1c' }}>
              {testStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5 text-sky-600" />
              ) : testStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{testMessage}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Server className="w-4 h-4 text-sky-600" />
              <span>Services this hub uses</span>
            </div>
            <ul className="pl-6 list-disc space-y-1 text-[11px] text-slate-500">
              <li>Autopilot — account health, adoption, alerts</li>
              <li>Paymaster — which orgs are on All-in-One</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200/50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin text-sky-600' : ''}`} />
            Test connection
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', boxShadow: '0 4px 12px rgba(14,165,233,0.15)' }}
          >
            Save & close
          </button>
        </div>
      </div>
    </div>
  );
};
