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
        setTestMessage(
          `Connected. Found health data for ${data.summary.totalAccounts} account(s).`
        );
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 text-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-sky-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Connection settings</h3>
              <p className="text-xs text-slate-500">Usually leave this alone — defaults work for CS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Override API key (optional)
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Leave blank to use the server default"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Only needed if your admin gave you a different key. Most CS teammates can ignore this.
            </p>
          </div>

          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testStatus === 'testing'
                  ? 'bg-sky-50 border-sky-200 text-sky-800'
                  : testStatus === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-sky-500 shrink-0 mt-0.5" />
              ) : testStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <span>{testMessage}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Server className="w-4 h-4 text-sky-600" />
              <span>Services this hub uses</span>
            </div>
            <ul className="pl-6 list-disc space-y-1 text-[11px]">
              <li>Autopilot — account health, adoption, alerts</li>
              <li>Paymaster — which orgs are on All-in-One</li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin text-sky-500' : ''}`} />
            Test connection
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
