import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Radio, 
  Zap, 
  ShieldCheck, 
  Sliders, 
  Layers, 
  Settings2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StreamPipeline, ProtocolType } from '../types';

interface ProtocolConversionMatrixProps {
  pipelines: StreamPipeline[];
  onAddPipeline: (pipeline: Partial<StreamPipeline>) => void;
  onUpdatePipeline: (id: string, patch: Partial<StreamPipeline>) => void;
  onDeletePipeline: (id: string) => void;
  onTogglePipeline: (id: string) => void;
}

export const ProtocolConversionMatrix: React.FC<ProtocolConversionMatrixProps> = ({
  pipelines,
  onAddPipeline,
  onUpdatePipeline,
  onDeletePipeline,
  onTogglePipeline
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPipeline, setNewPipeline] = useState({
    name: '',
    ingestProtocol: 'OMT' as ProtocolType,
    ingestUri: 'omt://192.168.10.20:9001/feed',
    egressProtocol: 'ST_2110_20' as ProtocolType,
    egressUri: 'rtp://239.100.1.10:50004',
    bridgeInterface: 'omt-br0',
    bitrateKbps: 45000,
    resolution: '1920x1080p 59.94',
    audioChannels: 8
  });

  const protocolList: ProtocolType[] = [
    'OMT', 
    'ST_2110_20', 
    'ST_2110_30', 
    'ST_2110_40', 
    'ST_2022_6', 
    'SRT', 
    'NDI', 
    'RTSP', 
    'RTMP', 
    'WebRTC', 
    'MPEG_TS'
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipeline.name) return;
    onAddPipeline(newPipeline);
    setShowAddModal(false);
    setNewPipeline({
      name: '',
      ingestProtocol: 'OMT',
      ingestUri: 'omt://192.168.10.20:9001/feed',
      egressProtocol: 'ST_2110_20',
      egressUri: 'rtp://239.100.1.10:50004',
      bridgeInterface: 'omt-br0',
      bitrateKbps: 45000,
      resolution: '1920x1080p 59.94',
      audioChannels: 8
    });
  };

  return (
    <div className="space-y-4 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0F0F12] p-4 rounded border border-slate-800">
        <div>
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2 font-mono">
            <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
            Protocol Conversion & Stream Routing Matrix
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Bidirectional conversion between Open Media Transport (OMT), SMPTE ST 2110, SRT, NDI, and WebRTC
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white text-xs px-3.5 py-1.5 rounded font-mono font-medium flex items-center space-x-1.5 shadow-md shadow-indigo-900/20 transition-all cursor-pointer uppercase tracking-tight"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Route</span>
        </button>
      </div>

      {/* Preset Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <button
          onClick={() => onAddPipeline({
            name: 'Quick OMT ➔ WebRTC Ultra-Low Latency Bridge',
            ingestProtocol: 'OMT',
            ingestUri: 'omt://192.168.10.10:9000/main',
            egressProtocol: 'WebRTC',
            egressUri: 'webrtc://localhost:8088/live/main',
            bitrateKbps: 25000,
            resolution: '1920x1080p 60'
          })}
          className="bg-[#16161D] hover:bg-slate-800/80 border border-slate-800 p-3 rounded text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
            <span>OMT</span>
            <span className="text-slate-500">➔</span>
            <span>WebRTC</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Browser Preview Direct Stream
          </div>
        </button>

        <button
          onClick={() => onAddPipeline({
            name: 'ST 2110-20 4K ➔ OMT Multicast Gateway',
            ingestProtocol: 'ST_2110_20',
            ingestUri: 'rtp://239.100.1.1:50004',
            egressProtocol: 'OMT',
            egressUri: 'omt://239.255.0.1:9000',
            bitrateKbps: 1200000,
            resolution: '3840x2160p 60'
          })}
          className="bg-[#16161D] hover:bg-slate-800/80 border border-slate-800 p-3 rounded text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-2 text-xs font-bold text-green-400">
            <span>ST 2110-20</span>
            <span className="text-slate-500">➔</span>
            <span>OMT</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            4K Broadcast Uncompressed Gateway
          </div>
        </button>

        <button
          onClick={() => onAddPipeline({
            name: 'SRT WAN Ingest ➔ OMT Studio Transport',
            ingestProtocol: 'SRT',
            ingestUri: 'srt://1.2.3.4:9000?mode=listener',
            egressProtocol: 'OMT',
            egressUri: 'omt://192.168.10.1:9004',
            bitrateKbps: 20000,
            resolution: '1920x1080p 59.94'
          })}
          className="bg-[#16161D] hover:bg-slate-800/80 border border-slate-800 p-3 rounded text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400">
            <span>SRT</span>
            <span className="text-slate-500">➔</span>
            <span>OMT</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Remote Field Ingest Buffer
          </div>
        </button>

        <button
          onClick={() => onAddPipeline({
            name: 'NDI Studio Feed ➔ SMPTE ST 2110-20 Output',
            ingestProtocol: 'NDI',
            ingestUri: 'ndi://STUDIO-A/Output',
            egressProtocol: 'ST_2110_20',
            egressUri: 'rtp://239.100.1.5:50004',
            bitrateKbps: 150000,
            resolution: '1920x1080p 50'
          })}
          className="bg-[#16161D] hover:bg-slate-800/80 border border-slate-800 p-3 rounded text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
            <span>NDI</span>
            <span className="text-slate-500">➔</span>
            <span>ST 2110-20</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Software Switcher to Broadcast IP
          </div>
        </button>
      </div>

      {/* Pipelines List */}
      <div className="space-y-3 font-mono">
        {pipelines.map((pipe) => (
          <div 
            key={pipe.id}
            className="bg-[#0F0F12] rounded border border-slate-800 p-4 transition-all hover:border-slate-700"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              
              {/* Route Summary */}
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onTogglePipeline(pipe.id)}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      pipe.status === 'active'
                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
                    }`}
                    title={pipe.status === 'active' ? 'Pause Pipeline' : 'Resume Pipeline'}
                  >
                    {pipe.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-tight">
                    {pipe.name}
                  </h3>

                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    pipe.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {pipe.status.toUpperCase()}
                  </span>
                </div>

                {/* Direct Protocol Ingest -> Egress Pipeline Visual */}
                <div className="flex items-center space-x-3 text-xs bg-[#0A0A0B] p-2.5 rounded border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-[9px] text-slate-500 uppercase">INGEST PROTOCOL</div>
                    <div className="text-indigo-300 font-bold">{pipe.ingestProtocol}</div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[160px]">{pipe.ingestUri}</div>
                  </div>

                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />

                  <div className="space-y-0.5">
                    <div className="text-[9px] text-slate-500 uppercase">BRIDGE DEVICE</div>
                    <div className="text-amber-400 font-bold">{pipe.bridgeInterface}</div>
                    <div className="text-[9px] text-slate-400">Linux veth/br</div>
                  </div>

                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />

                  <div className="space-y-0.5">
                    <div className="text-[9px] text-slate-500 uppercase">EGRESS PROTOCOL</div>
                    <div className="text-indigo-400 font-bold">{pipe.egressProtocol}</div>
                    <div className="text-[9px] text-slate-400 truncate max-w-[160px]">{pipe.egressUri}</div>
                  </div>
                </div>
              </div>

              {/* Live Telemetry Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#0A0A0B] p-2 rounded border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-500 uppercase">BITRATE</div>
                  <div className="text-indigo-400 font-bold">{(pipe.bitrateKbps / 1000).toFixed(1)} Mbps</div>
                </div>

                <div className="bg-[#0A0A0B] p-2 rounded border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-500 uppercase">LATENCY</div>
                  <div className="text-green-400 font-bold">{pipe.latencyMs} ms</div>
                </div>

                <div className="bg-[#0A0A0B] p-2 rounded border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-500 uppercase">JITTER</div>
                  <div className="text-amber-400 font-bold">{pipe.jitterMs} ms</div>
                </div>

                <div className="bg-[#0A0A0B] p-2 rounded border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-500 uppercase">AUDIO CH</div>
                  <div className="text-slate-300 font-bold">{pipe.audioChannels} Ch 24b</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => onDeletePipeline(pipe.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Remove Pipeline"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Add New Pipeline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F12] border border-slate-800 rounded w-full max-w-xl overflow-hidden shadow-2xl font-mono">
            <div className="bg-[#0A0A0B] px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add Stream Conversion Pipeline
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">
                  Pipeline Name
                </label>
                <input
                  type="text"
                  required
                  value={newPipeline.name}
                  onChange={e => setNewPipeline({ ...newPipeline, name: e.target.value })}
                  placeholder="e.g. Studio A Camera OMT to SRT Conversion"
                  className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">
                    Ingest Protocol
                  </label>
                  <select
                    value={newPipeline.ingestProtocol}
                    onChange={e => setNewPipeline({ ...newPipeline, ingestProtocol: e.target.value as ProtocolType })}
                    className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {protocolList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">
                    Egress Protocol
                  </label>
                  <select
                    value={newPipeline.egressProtocol}
                    onChange={e => setNewPipeline({ ...newPipeline, egressProtocol: e.target.value as ProtocolType })}
                    className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {protocolList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">
                    Ingest URI / Address
                  </label>
                  <input
                    type="text"
                    value={newPipeline.ingestUri}
                    onChange={e => setNewPipeline({ ...newPipeline, ingestUri: e.target.value })}
                    className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">
                    Egress URI / Address
                  </label>
                  <input
                    type="text"
                    value={newPipeline.egressUri}
                    onChange={e => setNewPipeline({ ...newPipeline, egressUri: e.target.value })}
                    className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">
                    Bitrate (Kbps)
                  </label>
                  <input
                    type="number"
                    value={newPipeline.bitrateKbps}
                    onChange={e => setNewPipeline({ ...newPipeline, bitrateKbps: Number(e.target.value) })}
                    className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">
                    Resolution & FPS
                  </label>
                  <input
                    type="text"
                    value={newPipeline.resolution}
                    onChange={e => setNewPipeline({ ...newPipeline, resolution: e.target.value })}
                    className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">
                    Audio Channels
                  </label>
                  <input
                    type="number"
                    value={newPipeline.audioChannels}
                    onChange={e => setNewPipeline({ ...newPipeline, audioChannels: Number(e.target.value) })}
                    className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white px-4 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors shadow-lg shadow-indigo-900/20 uppercase"
                >
                  Create Pipeline
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
