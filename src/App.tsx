import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { MultiViewPreview } from './components/MultiViewPreview';
import { ProtocolConversionMatrix } from './components/ProtocolConversionMatrix';
import { LinuxBridgeController } from './components/LinuxBridgeController';
import { StThingsNmosExplorer } from './components/StThingsNmosExplorer';
import { TelemetryAnalyzer } from './components/TelemetryAnalyzer';
import { AiDiagnosticsModal } from './components/AiDiagnosticsModal';
import { 
  NetworkBridgeInterface, 
  StreamPipeline, 
  PtpClockStatus, 
  NmosDevice, 
  SystemStats 
} from './types';
import {
  initialBridges,
  initialPipelines,
  initialPtpClock,
  initialNmosDevices,
  initialStats
} from './initialData';

// Helper for safe JSON fetching without unhandled exceptions
async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
    }
  } catch {
    // Network or server warming up; gracefully handle
  }
  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [bridges, setBridges] = useState<NetworkBridgeInterface[]>(initialBridges);
  const [pipelines, setPipelines] = useState<StreamPipeline[]>(initialPipelines);
  const [ptpClock, setPtpClock] = useState<PtpClockStatus | null>(initialPtpClock);
  const [nmosDevices, setNmosDevices] = useState<NmosDevice[]>(initialNmosDevices);
  const [stats, setStats] = useState<SystemStats | null>(initialStats);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const isServerAvailableRef = useRef(false);

  // Poll system state from backend with seamless fallback
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bridgesData, pipelinesData, ptpData, nmosData, statsData] = await Promise.all([
          safeFetchJson<NetworkBridgeInterface[]>('/api/bridges'),
          safeFetchJson<StreamPipeline[]>('/api/pipelines'),
          safeFetchJson<PtpClockStatus>('/api/ptp'),
          safeFetchJson<NmosDevice[]>('/api/nmos/devices'),
          safeFetchJson<SystemStats>('/api/stats')
        ]);

        if (bridgesData) {
          setBridges(bridgesData);
          isServerAvailableRef.current = true;
        }
        if (pipelinesData) {
          setPipelines(pipelinesData);
          isServerAvailableRef.current = true;
        }
        if (ptpData) {
          setPtpClock(ptpData);
          isServerAvailableRef.current = true;
        }
        if (nmosData) {
          setNmosDevices(nmosData);
          isServerAvailableRef.current = true;
        }
        if (statsData) {
          setStats(statsData);
          isServerAvailableRef.current = true;
        }

        // If backend API is temporarily offline, simulate live clock & audio jitter locally
        if (!bridgesData && !pipelinesData) {
          const now = new Date();
          const hrs = String(now.getHours()).padStart(2, '0');
          const mins = String(now.getMinutes()).padStart(2, '0');
          const secs = String(now.getSeconds()).padStart(2, '0');
          const frames = String(Math.floor((now.getMilliseconds() / 1000) * 60)).padStart(2, '0');
          const currentTimecode = `${hrs}:${mins}:${secs}:${frames}`;

          setPipelines(prev => prev.map(p => {
            if (p.status !== 'active') return p;
            const audioL = Math.max(-60, Math.min(0, p.audioLevels[0] + (Math.random() * 4 - 2)));
            const audioR = Math.max(-60, Math.min(0, p.audioLevels[1] + (Math.random() * 4 - 2)));
            return {
              ...p,
              timecode: currentTimecode,
              audioLevels: [parseFloat(audioL.toFixed(1)), parseFloat(audioR.toFixed(1))]
            };
          }));
        }
      } catch {
        // Silently preserve state
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Bridge Handlers (Optimistic local update + async sync)
  const handleCreateBridge = async (bridgeData: Partial<NetworkBridgeInterface>) => {
    const newBr: NetworkBridgeInterface = {
      id: `br-${Date.now()}`,
      name: bridgeData.name?.startsWith('omt-') || bridgeData.name?.startsWith('st') ? bridgeData.name : `omt-${bridgeData.name || 'br0'}`,
      type: 'bridge',
      ipAddress: bridgeData.ipAddress || '192.168.100.1',
      netmask: bridgeData.netmask || '255.255.255.0',
      macAddress: `52:54:00:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}`,
      mtu: bridgeData.mtu || 9000,
      status: 'up',
      slaves: bridgeData.slaves || [],
      vlanId: bridgeData.vlanId,
      rxBytes: 0,
      txBytes: 0,
      rxPackets: 0,
      txPackets: 0,
      rxDropped: 0,
      txDropped: 0,
      promiscuous: bridgeData.promiscuous ?? true,
      stpEnabled: bridgeData.stpEnabled ?? false
    };

    setBridges(prev => [...prev, newBr]);

    try {
      await fetch('/api/bridges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bridgeData)
      });
    } catch {
      // Retained in client state
    }
  };

  const handleToggleBridge = async (id: string) => {
    setBridges(prev => prev.map(b => b.id === id ? { ...b, status: b.status === 'up' ? 'down' : 'up' } : b));
    try {
      await fetch(`/api/bridges/${id}/toggle`, { method: 'POST' });
    } catch {
      // Retained in client state
    }
  };

  const handleModifySlave = async (id: string, slave: string, action: 'add' | 'remove') => {
    setBridges(prev => prev.map(b => {
      if (b.id !== id) return b;
      const slaves = action === 'add'
        ? Array.from(new Set([...b.slaves, slave]))
        : b.slaves.filter(s => s !== slave);
      return { ...b, slaves };
    }));

    try {
      await fetch(`/api/bridges/${id}/slaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slave, action })
      });
    } catch {
      // Retained in client state
    }
  };

  // Pipeline Handlers (Optimistic local update + async sync)
  const handleAddPipeline = async (pipeData: Partial<StreamPipeline>) => {
    const newPipe: StreamPipeline = {
      id: `pipe-${Date.now()}`,
      name: pipeData.name || 'New Broadcast Stream Pipeline',
      ingestProtocol: pipeData.ingestProtocol || 'OMT',
      ingestUri: pipeData.ingestUri || 'omt://192.168.10.60:9001',
      egressProtocol: pipeData.egressProtocol || 'ST_2110_20',
      egressUri: pipeData.egressUri || 'rtp://239.100.1.10:50004',
      bridgeInterface: pipeData.bridgeInterface || 'omt-br0',
      status: 'active',
      bitrateKbps: pipeData.bitrateKbps || 45000,
      fps: pipeData.fps || 60,
      latencyMs: 1.9,
      jitterMs: 0.15,
      packetLossPercent: 0.0,
      resolution: pipeData.resolution || '1920x1080p 60',
      timecode: '01:14:22:18',
      ptpLocked: true,
      tallyState: 'preview',
      audioChannels: 8,
      audioLevels: [-18, -18],
      sdpManifest: pipeData.sdpManifest
    };

    setPipelines(prev => [...prev, newPipe]);

    try {
      await fetch('/api/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pipeData)
      });
    } catch {
      // Retained in client state
    }
  };

  const handleUpdatePipeline = async (id: string, patch: Partial<StreamPipeline>) => {
    setPipelines(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    try {
      await fetch(`/api/pipelines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
    } catch {
      // Retained in client state
    }
  };

  const handleDeletePipeline = async (id: string) => {
    setPipelines(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(`/api/pipelines/${id}`, { method: 'DELETE' });
    } catch {
      // Retained in client state
    }
  };

  const handleTogglePipeline = async (id: string) => {
    setPipelines(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p));
    try {
      await fetch(`/api/pipelines/${id}/toggle`, { method: 'POST' });
    } catch {
      // Retained in client state
    }
  };

  const handleExportBridgeScript = () => {
    window.open('/api/export/bridge-script', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top Fixed Header */}
      <Header
        stats={stats}
        ptpClock={ptpClock}
        onOpenAiDiagnostics={() => setIsAiModalOpen(true)}
        onExportBridgeScript={handleExportBridgeScript}
      />

      {/* Navigation Bar */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeStreamCount={pipelines.filter(p => p.status === 'active').length}
        bridgeCount={bridges.length}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeTab === 'preview' && (
          <MultiViewPreview
            pipelines={pipelines}
            onUpdatePipeline={handleUpdatePipeline}
            onAddPipeline={handleAddPipeline}
          />
        )}

        {activeTab === 'matrix' && (
          <ProtocolConversionMatrix
            pipelines={pipelines}
            onAddPipeline={handleAddPipeline}
            onUpdatePipeline={handleUpdatePipeline}
            onDeletePipeline={handleDeletePipeline}
            onTogglePipeline={handleTogglePipeline}
          />
        )}

        {activeTab === 'bridge' && (
          <LinuxBridgeController
            bridges={bridges}
            pipelines={pipelines}
            onCreateBridge={handleCreateBridge}
            onToggleBridge={handleToggleBridge}
            onModifySlave={handleModifySlave}
            onExportScript={handleExportBridgeScript}
            onUpdatePipeline={handleUpdatePipeline}
          />
        )}

        {activeTab === 'stthings' && (
          <StThingsNmosExplorer
            ptpClock={ptpClock}
            nmosDevices={nmosDevices}
            pipelines={pipelines}
          />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryAnalyzer
            stats={stats}
            pipelines={pipelines}
          />
        )}

        {activeTab === 'ai' && (
          <div className="bg-[#0F0F12] rounded-lg border border-slate-800 p-8 text-center space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
              AI Broadcast Network Diagnostics
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Launch the AI Engineer Assistant to diagnose UDP multicast drops, socket buffer sizing, PTP clock jitter, and ST 2110 SDP manifests.
            </p>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded text-xs font-mono font-medium cursor-pointer shadow-lg shadow-indigo-900/20 border border-indigo-500 inline-flex items-center gap-2 uppercase tracking-wide"
            >
              Open AI Assistant
            </button>
          </div>
        )}
      </main>

      {/* AI Assistant Modal */}
      <AiDiagnosticsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        pipelines={pipelines}
      />

      {/* Footer Status Bar */}
      <footer className="bg-[#0F0F12] border-t border-slate-800 py-3 text-center text-[11px] text-slate-500 font-mono uppercase tracking-wider">
        Open Media Transport (OMT) Linux Bridge & SMPTE ST 2110 / ST 2022 Gateway Control Center
      </footer>

    </div>
  );
}
