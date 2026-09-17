import React, { useState } from 'react';
import { 
  Bot, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Check, 
  AlertTriangle,
  Send,
  Loader2
} from 'lucide-react';
import { StreamPipeline } from '../types';

interface AiDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelines: StreamPipeline[];
}

export const AiDiagnosticsModal: React.FC<AiDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  pipelines
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    analysis: string;
    recommendations: string[];
    sysctlCommands: string[];
  } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleRunDiagnosis = async (customPrompt?: string) => {
    setLoading(true);
    setResult(null);

    const promptText = customPrompt || query || "Analyze current OMT and ST 2110 pipelines and advise on socket buffer and PTP settings.";

    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: promptText, pipelineContext: pipelines })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('AI Diagnosis request failed.');
    } finally {
      setLoading(false);
    }
  };

  const presetQueries = [
    "Check for dropped UDP multicast packets on Linux bridge interfaces",
    "Verify PTP IEEE 1588 clock sync and frame rate alignment",
    "Optimize socket buffers for 4K SMPTE ST 2110-20 streams",
    "Diagnose SRT caller latency and ARQ packet retransmission settings"
  ];

  const handleCopyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0F0F12] border border-slate-800 rounded w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#0A0A0B] px-5 py-3 border-b border-slate-800 flex items-center justify-between font-mono">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded bg-indigo-600 text-white border border-indigo-500">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
                Broadcast AI Network Assistant
                <span className="text-[9px] bg-indigo-950/80 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/80 uppercase">
                  Gemini 2.5 Flash
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Automated Linux kernel tuning, OMT protocol analysis, and ST 2110 troubleshooting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono">
          
          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick AI Diagnostic Presets:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presetQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(q);
                    handleRunDiagnosis(q);
                  }}
                  className="text-left bg-[#0A0A0B] hover:bg-slate-800/60 border border-slate-800 p-2 rounded text-[11px] text-slate-300 transition-colors cursor-pointer flex items-center justify-between group font-mono"
                >
                  <span className="truncate">{q}</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask AI broadcast engineer (e.g., 'How to fix audio jitter on ST 2110-30?')"
              className="flex-1 bg-[#0A0A0B] border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={() => handleRunDiagnosis()}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white px-3.5 py-2 rounded text-xs font-mono font-medium flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 uppercase tracking-tight"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Analyze</span>
            </button>
          </div>

          {/* Results Area */}
          {loading && (
            <div className="bg-[#0A0A0B] rounded p-6 border border-slate-800 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
              <div className="text-xs text-slate-300 font-mono">
                Analyzing OMT bridge socket buffers, RTP timestamps, and PTP domain sync...
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3 pt-1">
              
              {/* Analysis Text */}
              <div className="bg-[#0A0A0B] rounded p-3 border border-slate-800 space-y-1.5">
                <h4 className="text-xs font-bold text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Engineering Analysis
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {result.analysis}
                </p>
              </div>

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-[#0A0A0B] rounded p-3 border border-slate-800 space-y-1.5">
                  <h4 className="text-xs font-bold text-green-400 font-mono uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    Actionable Engineering Recommendations
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300 font-sans">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-green-500 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Linux Sysctl Commands */}
              {result.sysctlCommands && result.sysctlCommands.length > 0 && (
                <div className="bg-[#0A0A0B] rounded p-3 border border-slate-800 space-y-1.5">
                  <h4 className="text-xs font-bold text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    Recommended Linux Kernel Tuning Commands
                  </h4>
                  <div className="space-y-1.5 font-mono text-xs">
                    {result.sysctlCommands.map((cmd, i) => (
                      <div key={i} className="bg-[#0F0F12] p-2 rounded border border-slate-800 flex items-center justify-between">
                        <span className="text-indigo-300 text-[11px]">{cmd}</span>
                        <button
                          onClick={() => handleCopyCommand(cmd, i)}
                          className="text-slate-400 hover:text-white p-1 cursor-pointer"
                          title="Copy command"
                        >
                          {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
