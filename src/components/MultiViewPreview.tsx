import React, { useState } from 'react';
import { 
  Grid2x2, 
  Grid3x3, 
  Square, 
  Layout, 
  Plus, 
  X, 
  Sparkles, 
  Maximize2,
  Tv,
  CheckCircle2
} from 'lucide-react';
import { StreamPipeline } from '../types';
import { StreamPlayerCard } from './StreamPlayerCard';

interface MultiViewPreviewProps {
  pipelines: StreamPipeline[];
  onUpdatePipeline: (id: string, patch: Partial<StreamPipeline>) => void;
  onAddPipeline: (pipeline: Partial<StreamPipeline>) => void;
}

export const MultiViewPreview: React.FC<MultiViewPreviewProps> = ({
  pipelines,
  onUpdatePipeline,
  onAddPipeline
}) => {
  const [layoutMode, setLayoutMode] = useState<'grid-2x2' | 'grid-3x3' | 'single' | 'master-1+5'>('grid-2x2');
  const [activeSingleId, setActiveSingleId] = useState<string | null>(pipelines[0]?.id || null);
  const [sdpModalData, setSdpModalData] = useState<{ sdp: string; title: string } | null>(null);

  // Filter pipelines based on layout mode
  const displayedPipelines = layoutMode === 'single'
    ? pipelines.filter(p => p.id === (activeSingleId || pipelines[0]?.id))
    : layoutMode === 'grid-2x2'
      ? pipelines.slice(0, 4)
      : layoutMode === 'grid-3x3'
        ? pipelines.slice(0, 9)
        : pipelines;

  return (
    <div className="space-y-4">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0F0F12] p-4 rounded border border-slate-800">
        
        <div>
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Tv className="w-4 h-4 text-indigo-400" />
            Active Stream Previews & Multi-View Matrix
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Real-time OMT, ST 2110-20/30/40, SRT, and WebRTC uncompressed/low-latency stream monitors
          </p>
        </div>

        {/* Layout Mode Selector */}
        <div className="flex items-center space-x-1.5 bg-[#0A0A0B] p-1 rounded border border-slate-800 font-mono">
          <button
            onClick={() => setLayoutMode('single')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-tight flex items-center space-x-1 transition-colors cursor-pointer ${
              layoutMode === 'single' ? 'bg-indigo-600 text-white border border-indigo-500' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Single Focus View"
          >
            <Square className="w-3 h-3" />
            <span className="hidden md:inline">Single</span>
          </button>

          <button
            onClick={() => setLayoutMode('grid-2x2')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-tight flex items-center space-x-1 transition-colors cursor-pointer ${
              layoutMode === 'grid-2x2' ? 'bg-indigo-600 text-white border border-indigo-500' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="2x2 Quad Grid"
          >
            <Grid2x2 className="w-3 h-3" />
            <span className="hidden md:inline">2x2 Quad</span>
          </button>

          <button
            onClick={() => setLayoutMode('grid-3x3')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-tight flex items-center space-x-1 transition-colors cursor-pointer ${
              layoutMode === 'grid-3x3' ? 'bg-indigo-600 text-white border border-indigo-500' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="3x3 Multi-Grid"
          >
            <Grid3x3 className="w-3 h-3" />
            <span className="hidden md:inline">3x3 Grid</span>
          </button>

          <button
            onClick={() => setLayoutMode('master-1+5')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-tight flex items-center space-x-1 transition-colors cursor-pointer ${
              layoutMode === 'master-1+5' ? 'bg-indigo-600 text-white border border-indigo-500' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Master 1+5 Production Layout"
          >
            <Layout className="w-3 h-3" />
            <span className="hidden md:inline">1+5 Master</span>
          </button>
        </div>

      </div>

      {/* Single View Stream Selector Tabs if layout is Single */}
      {layoutMode === 'single' && (
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none font-mono">
          {pipelines.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveSingleId(p.id)}
              className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                (activeSingleId || pipelines[0]?.id) === p.id
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-[#0F0F12] text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Stream Grid Area */}
      {pipelines.length === 0 ? (
        <div className="bg-[#0F0F12] rounded p-12 border border-slate-800 text-center space-y-4 font-mono">
          <Tv className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">No Active Stream Pipelines</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Configure an OMT or SMPTE ST 2110 stream conversion route in the Protocol Conversion Matrix to enable live preview.
          </p>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          layoutMode === 'single'
            ? 'grid-cols-1 max-w-4xl mx-auto'
            : layoutMode === 'grid-2x2'
              ? 'grid-cols-1 md:grid-cols-2'
              : layoutMode === 'grid-3x3'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 lg:grid-cols-3'
        }`}>
          {displayedPipelines.map((pipeline) => (
            <StreamPlayerCard
              key={pipeline.id}
              pipeline={pipeline}
              onUpdatePipeline={onUpdatePipeline}
              onOpenSdpModal={(sdp, title) => setSdpModalData({ sdp, title })}
              layoutMode={layoutMode}
            />
          ))}
        </div>
      )}

      {/* SDP Manifest Modal */}
      {sdpModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F12] border border-slate-800 rounded w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="bg-[#0A0A0B] px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
                  SDP Manifest Inspector
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">{sdpModalData.title}</p>
              </div>
              <button
                onClick={() => setSdpModalData(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#0A0A0B] p-4 rounded border border-slate-800 font-mono text-xs text-indigo-300 whitespace-pre overflow-x-auto select-all">
                {sdpModalData.sdp}
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                <span>RFC 4566 / ST 2110-20 Session Description</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sdpModalData.sdp);
                    alert('SDP copied to clipboard!');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded font-mono text-xs font-medium cursor-pointer transition-colors border border-indigo-500"
                >
                  Copy SDP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
