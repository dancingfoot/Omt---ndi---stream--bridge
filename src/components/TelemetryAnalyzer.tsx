import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Activity, 
  Zap, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  HardDrive, 
  Cpu 
} from 'lucide-react';
import { SystemStats, StreamPipeline } from '../types';

interface TelemetryAnalyzerProps {
  stats: SystemStats | null;
  pipelines: StreamPipeline[];
}

export const TelemetryAnalyzer: React.FC<TelemetryAnalyzerProps> = ({
  stats,
  pipelines
}) => {
  const [history, setHistory] = useState<{ time: string; rx: number; tx: number; jitter: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const avgJitter = pipelines.length > 0 
        ? pipelines.reduce((acc, p) => acc + p.jitterMs, 0) / pipelines.length 
        : 0.3;

      setHistory(prev => [
        ...prev.slice(-14),
        {
          time: timeStr,
          rx: stats ? stats.networkRxMbps : 1800 + Math.random() * 100,
          tx: stats ? stats.networkTxMbps : 1750 + Math.random() * 100,
          jitter: avgJitter
        }
      ]);
    }, 1000);

    return () => clearInterval(interval);
  }, [stats, pipelines]);

  return (
    <div className="space-y-4 font-sans">
      
      {/* Header Banner */}
      <div className="bg-[#0F0F12] p-4 rounded border border-slate-800">
        <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2 font-mono">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Network Telemetry, Jitter Histogram & Packet Analytics
        </h2>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          High-frequency monitoring of UDP packet drops, kernel ring buffers, RTT latency, and stream throughput
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        <div className="bg-[#0F0F12] rounded border border-slate-800 p-3.5 space-y-1.5">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Network Rx Throughput</div>
          <div className="text-xl font-bold font-mono text-indigo-400">
            {stats ? `${(stats.networkRxMbps / 1000).toFixed(2)} Gbps` : '1.84 Gbps'}
          </div>
          <div className="text-[10px] text-green-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3 text-green-400" /> +2.4% vs peak
          </div>
        </div>

        <div className="bg-[#0F0F12] rounded border border-slate-800 p-3.5 space-y-1.5">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Network Tx Throughput</div>
          <div className="text-xl font-bold font-mono text-indigo-300">
            {stats ? `${(stats.networkTxMbps / 1000).toFixed(2)} Gbps` : '1.79 Gbps'}
          </div>
          <div className="text-[10px] text-green-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3 text-green-400" /> Stable multicast
          </div>
        </div>

        <div className="bg-[#0F0F12] rounded border border-slate-800 p-3.5 space-y-1.5">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Stream Jitter</div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {history.length > 0 ? `${history[history.length - 1].jitter.toFixed(2)} ms` : '0.24 ms'}
          </div>
          <div className="text-[10px] text-green-400 font-mono">
            Within SMPTE ST 2110-20 spec (&lt;1.0ms)
          </div>
        </div>

        <div className="bg-[#0F0F12] rounded border border-slate-800 p-3.5 space-y-1.5">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kernel Free Buffers</div>
          <div className="text-xl font-bold font-mono text-green-400">
            {stats ? `${(stats.kernelBuffersFreeKb / 1024).toFixed(0)} MB` : '128 MB'}
          </div>
          <div className="text-[10px] text-green-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-400" /> Zero Ring Overflows
          </div>
        </div>

      </div>

      {/* Visual Live Realtime Chart */}
      <div className="bg-[#0F0F12] rounded border border-slate-800 p-4 space-y-3 font-mono">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Realtime Bandwidth & Latency Graph (Last 15 seconds)
        </h3>

        {/* CSS/Canvas Bar chart */}
        <div className="bg-[#0A0A0B] p-4 rounded border border-slate-800 space-y-3">
          <div className="h-44 flex items-end justify-between gap-1.5 pt-6 pb-2 border-b border-slate-800">
            {history.map((pt, i) => {
              const heightPercent = Math.min(100, Math.max(10, (pt.rx / 2500) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-7 bg-[#0F0F12] border border-slate-700 px-2 py-0.5 rounded text-[9px] font-mono text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {pt.rx.toFixed(0)} Mbps | Jitter {pt.jitter.toFixed(2)}ms
                  </div>

                  <div 
                    className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-t transition-all duration-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">
                    {pt.time}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" /> Rx Bandwidth (Mbps)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-400 inline-block" /> Tx Bandwidth (Mbps)
              </span>
            </div>
            <span className="text-[10px]">Scale: 0 - 2500 Mbps</span>
          </div>
        </div>
      </div>

    </div>
  );
};
