import React, { useState } from 'react';
import { 
  Network, 
  Plus, 
  Power, 
  Terminal, 
  Download, 
  Sliders, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  Activity,
  HardDrive
} from 'lucide-react';
import { NetworkBridgeInterface, StreamPipeline } from '../types';
import { BridgeStreamLivePreview } from './BridgeStreamLivePreview';

interface LinuxBridgeControllerProps {
  bridges: NetworkBridgeInterface[];
  pipelines?: StreamPipeline[];
  onCreateBridge: (bridge: Partial<NetworkBridgeInterface>) => void;
  onToggleBridge: (id: string) => void;
  onModifySlave: (id: string, slave: string, action: 'add' | 'remove') => void;
  onExportScript: () => void;
  onUpdatePipeline?: (id: string, patch: Partial<StreamPipeline>) => void;
}

export const LinuxBridgeController: React.FC<LinuxBridgeControllerProps> = ({
  bridges,
  pipelines = [],
  onCreateBridge,
  onToggleBridge,
  onModifySlave,
  onExportScript,
  onUpdatePipeline
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSlaveInput, setNewSlaveInput] = useState<{ [key: string]: string }>({});
  const [newBridgeForm, setNewBridgeForm] = useState({
    name: 'omt-br1',
    ipAddress: '192.168.20.1',
    netmask: '255.255.255.0',
    mtu: 9000,
    promiscuous: true,
    stpEnabled: false,
    slaves: ['eth0', 'veth-omt2']
  });

  // Simulated sysctl tuning parameters
  const [sysctlParams, setSysctlParams] = useState({
    rmemMax: 67108864,
    wmemMax: 67108864,
    igmpMaxMemberships: 1024,
    rpFilter: 0
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateBridge(newBridgeForm);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0F0F12] p-4 rounded border border-slate-800">
        <div>
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Network className="w-4 h-4 text-indigo-400" />
            Linux Kernel Network Bridge & Interface Controller
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Virtual bridge interfaces (`omt-br0`), VLAN tagging, Jumbo Frames (MTU 9000), and socket buffer optimization
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white text-xs px-3.5 py-1.5 rounded font-mono font-medium flex items-center space-x-1.5 shadow-md shadow-indigo-900/20 transition-all cursor-pointer uppercase tracking-tight"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Linux Bridge</span>
          </button>

          <button
            onClick={onExportScript}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded font-mono font-medium flex items-center space-x-1.5 cursor-pointer uppercase tracking-tight"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export `.sh` Script</span>
          </button>
        </div>
      </div>

      {/* Linux Bridges Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
        {bridges.map((br) => (
          <div 
            key={br.id}
            className={`bg-[#0F0F12] rounded border p-4 space-y-3 transition-all ${
              br.status === 'up' ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
            }`}
          >
            
            {/* Header & Status Toggle */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => onToggleBridge(br.id)}
                  className={`p-1.5 rounded transition-all cursor-pointer ${
                    br.status === 'up' 
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30' 
                      : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
                  }`}
                  title={br.status === 'up' ? 'Bring Bridge DOWN' : 'Bring Bridge UP'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-tight">{br.name}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      br.status === 'up' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {br.status.toUpperCase()}
                    </span>
                    {br.mtu >= 9000 && (
                      <span className="px-1.5 py-0.5 text-[9px] bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 rounded font-bold">
                        JUMBO 9000
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    IP: {br.ipAddress} | MAC: {br.macAddress}
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono">
                <div className="text-indigo-400 font-bold">{(br.rxBytes / (1024*1024*1024)).toFixed(2)} GB Rx</div>
                <div className="text-indigo-300 font-bold">{(br.txBytes / (1024*1024*1024)).toFixed(2)} GB Tx</div>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-[#0A0A0B] p-2 rounded border border-slate-800 text-center">
                <div className="text-[9px] text-slate-500 uppercase">MTU</div>
                <div className="text-slate-200 font-bold text-xs">{br.mtu}</div>
              </div>

              <div className="bg-[#0A0A0B] p-2 rounded border border-slate-800 text-center">
                <div className="text-[9px] text-slate-500 uppercase">PROMISCUOUS</div>
                <div className={br.promiscuous ? "text-green-400 font-bold text-xs" : "text-slate-400 text-xs"}>
                  {br.promiscuous ? "ENABLED" : "DISABLED"}
                </div>
              </div>

              <div className="bg-[#0A0A0B] p-2 rounded border border-slate-800 text-center">
                <div className="text-[9px] text-slate-500 uppercase">STP STATE</div>
                <div className={br.stpEnabled ? "text-amber-400 font-bold text-xs" : "text-slate-400 text-xs"}>
                  {br.stpEnabled ? "ACTIVE" : "OFF"}
                </div>
              </div>
            </div>

            {/* Slave Member Interfaces */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="text-[11px]">Attached Member Interfaces ({br.slaves.length}):</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {br.slaves.map((slave) => (
                  <span 
                    key={slave}
                    className="bg-[#0A0A0B] text-indigo-300 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5"
                  >
                    <Layers className="w-3 h-3 text-indigo-400" />
                    {slave}
                    <button
                      onClick={() => onModifySlave(br.id, slave, 'remove')}
                      className="text-slate-500 hover:text-red-400 ml-1 cursor-pointer"
                      title="Detach interface"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Slave Input */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  placeholder="Attach slave e.g. veth-omt3"
                  value={newSlaveInput[br.id] || ''}
                  onChange={e => setNewSlaveInput({ ...newSlaveInput, [br.id]: e.target.value })}
                  className="bg-[#0A0A0B] border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-mono flex-1 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => {
                    if (newSlaveInput[br.id]) {
                      onModifySlave(br.id, newSlaveInput[br.id], 'add');
                      setNewSlaveInput({ ...newSlaveInput, [br.id]: '' });
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1 rounded font-mono cursor-pointer uppercase"
                >
                  Attach
                </button>
              </div>

            </div>

          </div>
        ))}
      </div>

      {/* Linux Kernel Socket Tuning Panel */}
      <div className="bg-[#0F0F12] rounded border border-slate-800 p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Kernel Socket Buffer & Multicast Tuning (`sysctl`)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Optimized for 4K SMPTE ST 2110-20 & OMT high packet throughput (1.5 Gbps per feed)
            </p>
          </div>

          <button
            onClick={() => alert('Kernel parameters applied to simulated network stack.')}
            className="bg-green-600 hover:bg-green-500 border border-green-500 text-white text-xs px-3 py-1 rounded font-mono font-medium cursor-pointer uppercase"
          >
            Apply `sysctl`
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          
          <div className="bg-[#0A0A0B] p-2.5 rounded border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">net.core.rmem_max</div>
            <input
              type="number"
              value={sysctlParams.rmemMax}
              onChange={e => setSysctlParams({ ...sysctlParams, rmemMax: Number(e.target.value) })}
              className="bg-[#0F0F12] border border-slate-800 rounded px-2 py-1 text-indigo-300 w-full focus:outline-none"
            />
            <div className="text-[9px] text-slate-500">Max Rx Buffer (64MB Rec)</div>
          </div>

          <div className="bg-[#0A0A0B] p-2.5 rounded border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">net.core.wmem_max</div>
            <input
              type="number"
              value={sysctlParams.wmemMax}
              onChange={e => setSysctlParams({ ...sysctlParams, wmemMax: Number(e.target.value) })}
              className="bg-[#0F0F12] border border-slate-800 rounded px-2 py-1 text-indigo-300 w-full focus:outline-none"
            />
            <div className="text-[9px] text-slate-500">Max Tx Buffer (64MB Rec)</div>
          </div>

          <div className="bg-[#0A0A0B] p-2.5 rounded border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">net.ipv4.igmp_max_memberships</div>
            <input
              type="number"
              value={sysctlParams.igmpMaxMemberships}
              onChange={e => setSysctlParams({ ...sysctlParams, igmpMaxMemberships: Number(e.target.value) })}
              className="bg-[#0F0F12] border border-slate-800 rounded px-2 py-1 text-indigo-300 w-full focus:outline-none"
            />
            <div className="text-[9px] text-slate-500">Max IGMP Multicast Feeds</div>
          </div>

          <div className="bg-[#0A0A0B] p-2.5 rounded border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">net.ipv4.conf.all.rp_filter</div>
            <input
              type="number"
              value={sysctlParams.rpFilter}
              onChange={e => setSysctlParams({ ...sysctlParams, rpFilter: Number(e.target.value) })}
              className="bg-[#0F0F12] border border-slate-800 rounded px-2 py-1 text-indigo-300 w-full focus:outline-none"
            />
            <div className="text-[9px] text-slate-500">Reverse Path Filtering (0=Off)</div>
          </div>

        </div>
      </div>

      {/* Linux Bridge Video Streams Real-Time Preview Component */}
      <div className="pt-2">
        <BridgeStreamLivePreview
          bridges={bridges}
          pipelines={pipelines}
          onUpdatePipeline={onUpdatePipeline}
        />
      </div>

      {/* Create Bridge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">
                Create Virtual Linux Bridge
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Bridge Name
                </label>
                <input
                  type="text"
                  required
                  value={newBridgeForm.name}
                  onChange={e => setNewBridgeForm({ ...newBridgeForm, name: e.target.value })}
                  placeholder="e.g. omt-br2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={newBridgeForm.ipAddress}
                    onChange={e => setNewBridgeForm({ ...newBridgeForm, ipAddress: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    MTU Size
                  </label>
                  <input
                    type="number"
                    value={newBridgeForm.mtu}
                    onChange={e => setNewBridgeForm({ ...newBridgeForm, mtu: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBridgeForm.promiscuous}
                    onChange={e => setNewBridgeForm({ ...newBridgeForm, promiscuous: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Promiscuous Mode</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBridgeForm.stpEnabled}
                    onChange={e => setNewBridgeForm({ ...newBridgeForm, stpEnabled: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>STP Enabled</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors shadow-lg shadow-cyan-950"
                >
                  Create Bridge
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
