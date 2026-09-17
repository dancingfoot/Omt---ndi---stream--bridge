import React from 'react';
import { 
  Radio, 
  Activity, 
  Server, 
  Clock, 
  Download, 
  Bot, 
  Zap, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { PtpClockStatus, SystemStats } from '../types';

interface HeaderProps {
  stats: SystemStats | null;
  ptpClock: PtpClockStatus | null;
  onOpenAiDiagnostics: () => void;
  onExportBridgeScript: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  ptpClock,
  onOpenAiDiagnostics,
  onExportBridgeScript
}) => {
  return (
    <header className="bg-[#0F0F12] border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-900/20 border border-indigo-500/30 shrink-0">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-tight text-slate-100 uppercase font-mono">
                  OPEN MEDIA TRANSPORT <span className="text-indigo-400">// NODE_01A</span>
                </h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-green-500 uppercase font-semibold">System Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* PTP Clock Status */}
            <div className="flex items-center space-x-2 bg-[#16161D] px-3 py-1.5 rounded border border-slate-800 text-[11px] font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-500 uppercase text-[9px]">PTP IEEE1588:</span>
                  <span className="text-emerald-400 font-bold">
                    {ptpClock?.state === 'LOCKED' ? 'LOCKED' : 'SYNCING'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400">
                  Offset: {ptpClock ? `${ptpClock.offsetFromMasterNs}ns` : '24ns'}
                </div>
              </div>
            </div>

            {/* System Bandwidth Stats */}
            <div className="flex items-center space-x-2 bg-[#16161D] px-3 py-1.5 rounded border border-slate-800 text-[11px] font-mono">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-500 uppercase text-[9px]">THROUGHPUT:</span>
                  <span className="text-slate-200 font-bold">
                    {stats ? `${(stats.networkTxMbps / 1000).toFixed(2)} GBPS` : '1.24 GBPS'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400">
                  Active Streams: {stats?.activeStreamsCount ?? 4}
                </div>
              </div>
            </div>

            {/* CPU / Mem */}
            <div className="flex items-center space-x-2 bg-[#16161D] px-3 py-1.5 rounded border border-slate-800 text-[11px] font-mono">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-500 uppercase text-[9px]">CPU LOAD:</span>
                  <span className="text-slate-200 font-bold">{stats?.cpuUsagePercent ?? 14.2}%</span>
                </div>
                <div className="text-[9px] text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> MTU 9000 JUMBO
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 font-mono">
            
            <button
              onClick={onOpenAiDiagnostics}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded border border-indigo-500 font-medium shadow-md shadow-indigo-900/20 transition-all cursor-pointer"
              title="Run AI Broadcast Engineer Diagnosis"
            >
              <Bot className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">AI Diagnostics</span>
            </button>

            <button
              onClick={onExportBridgeScript}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded font-medium transition-all border border-slate-700 cursor-pointer"
              title="Export Linux Bridge Setup Shell Script"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Export Script</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
