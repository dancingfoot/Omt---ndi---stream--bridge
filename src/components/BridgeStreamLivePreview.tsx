import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Network, 
  Layers, 
  Activity, 
  Volume2, 
  VolumeX, 
  Camera, 
  Play, 
  Pause, 
  Maximize2, 
  FileText, 
  Zap, 
  CheckCircle2, 
  Filter,
  ArrowRight,
  ShieldCheck,
  Radio,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { NetworkBridgeInterface, StreamPipeline } from '../types';

interface BridgeStreamLivePreviewProps {
  bridges: NetworkBridgeInterface[];
  pipelines: StreamPipeline[];
  onUpdatePipeline?: (id: string, patch: Partial<StreamPipeline>) => void;
  onOpenSdpModal?: (sdp: string, title: string) => void;
}

export const BridgeStreamLivePreview: React.FC<BridgeStreamLivePreviewProps> = ({
  bridges,
  pipelines,
  onUpdatePipeline,
  onOpenSdpModal
}) => {
  const [selectedBridgeFilter, setSelectedBridgeFilter] = useState<string>('all');
  const [activeSingleStreamId, setActiveSingleStreamId] = useState<string | null>(null);
  const [useCameraMap, setUseCameraMap] = useState<{ [key: string]: boolean }>({});
  const [audioMuteMap, setAudioMuteMap] = useState<{ [key: string]: boolean }>({});
  const [pausedStreams, setPausedStreams] = useState<{ [key: string]: boolean }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Filter streams handled by the selected Linux bridge
  const filteredPipelines = selectedBridgeFilter === 'all'
    ? pipelines
    : pipelines.filter(p => p.bridgeInterface === selectedBridgeFilter);

  // Group streams by Linux bridge interface
  const bridgeStreamCounts = bridges.reduce((acc, br) => {
    acc[br.name] = pipelines.filter(p => p.bridgeInterface === br.name).length;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="space-y-4 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0F0F12] p-4 rounded border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block" />
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2 font-mono">
              <Tv className="w-4 h-4 text-indigo-400" />
              Linux Bridge Video Stream Real-Time Monitor
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Live uncompressed video frame buffers processed through virtual bridge interfaces (`omt-br0`, `st2110-br1`, `srt-br0`)
          </p>
        </div>

        {/* Bridge Filter Selector */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          <button
            onClick={() => setSelectedBridgeFilter('all')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
              selectedBridgeFilter === 'all'
                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-sm'
                : 'bg-[#0A0A0B] text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            All Bridges ({pipelines.length})
          </button>

          {bridges.map(br => {
            const count = bridgeStreamCounts[br.name] || 0;
            return (
              <button
                key={br.id}
                onClick={() => setSelectedBridgeFilter(br.name)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedBridgeFilter === br.name
                    ? 'bg-indigo-600 text-white border border-indigo-500 shadow-sm'
                    : 'bg-[#0A0A0B] text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Network className="w-3 h-3 text-indigo-400" />
                <span>{br.name}</span>
                <span className="px-1 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Stream Cards Grid */}
      {filteredPipelines.length === 0 ? (
        <div className="bg-[#0F0F12] rounded p-10 border border-slate-800 text-center space-y-3 font-mono">
          <Radio className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            No Active Streams Handled by Bridge "{selectedBridgeFilter}"
          </h3>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Attach member interfaces or create stream routes bound to bridge interface <code className="text-indigo-400">{selectedBridgeFilter}</code>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPipelines.map((pipeline) => {
            const boundBridge = bridges.find(b => b.name === pipeline.bridgeInterface);
            const isPaused = pausedStreams[pipeline.id] || pipeline.status === 'paused';

            return (
              <BridgeSingleStreamCard
                key={pipeline.id}
                pipeline={pipeline}
                bridge={boundBridge}
                isPaused={isPaused}
                onTogglePause={() => {
                  setPausedStreams(prev => ({ ...prev, [pipeline.id]: !prev[pipeline.id] }));
                  if (onUpdatePipeline) {
                    onUpdatePipeline(pipeline.id, {
                      status: isPaused ? 'active' : 'paused'
                    });
                  }
                }}
                onUpdatePipeline={onUpdatePipeline}
                onOpenSdpModal={onOpenSdpModal}
              />
            );
          })}
        </div>
      )}

      {/* Linux Kernel Bridge Routing Summary Footer */}
      <div className="bg-[#0F0F12] p-3.5 rounded border border-slate-800 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
          <span>Kernel Socket Ring Buffer: <strong className="text-slate-200">64MB</strong> | Zero UDP Packets Dropped</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/80 uppercase font-bold">
            SMPTE ST 2110 / OMT Ready
          </span>
          <span>PTP Clock Sync: <strong className="text-green-400">24ns Offset</strong></span>
        </div>
      </div>

    </div>
  );
};

// Subcomponent: Live Canvas Player Card for an Individual Linux Bridge Stream
interface BridgeSingleStreamCardProps {
  pipeline: StreamPipeline;
  bridge?: NetworkBridgeInterface;
  isPaused: boolean;
  onTogglePause: () => void;
  onUpdatePipeline?: (id: string, patch: Partial<StreamPipeline>) => void;
  onOpenSdpModal?: (sdp: string, title: string) => void;
}

const BridgeSingleStreamCard: React.FC<BridgeSingleStreamCardProps> = ({
  pipeline,
  bridge,
  isPaused,
  onTogglePause,
  onUpdatePipeline,
  onOpenSdpModal
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  // Real-time Canvas Renderer (60fps simulation of Linux Bridge Packet Processing)
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame = 0;

    const render = () => {
      if (!isPaused) {
        localFrame++;
        setFrameCount(localFrame);
      }

      const w = canvas.width;
      const h = canvas.height;

      if (useCamera && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, w, h);
      } else {
        // Draw Broadcast SMPTE Test Pattern
        const barW = w / 7;
        const colors = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
        
        colors.forEach((col, i) => {
          ctx.fillStyle = col;
          ctx.fillRect(i * barW, 0, barW, h * 0.7);
        });

        // Bottom Signal Strip
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, h * 0.7, w, h * 0.3);

        // Animated Moving OMT Bridge Scanline
        const scanX = isPaused ? (localFrame * 2) % w : (localFrame * 4) % w;
        const scanGrad = ctx.createLinearGradient(scanX - 50, 0, scanX + 50, 0);
        scanGrad.addColorStop(0, 'rgba(99, 102, 241, 0)');
        scanGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.85)');
        scanGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(scanX - 50, 0, 100, h * 0.7);

        // Grid Crosshair Overlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        // Canvas Overlay Text
        ctx.fillStyle = 'rgba(15, 15, 18, 0.85)';
        ctx.fillRect(12, 12, 260, 28);
        ctx.fillStyle = '#818cf8';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`BRIDGE: ${pipeline.bridgeInterface} | FRAME: #${localFrame}`, 20, 30);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [useCamera, isPaused, pipeline.bridgeInterface]);

  // Camera toggle
  const toggleCamera = async () => {
    if (!useCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setUseCamera(true);
      } catch (err) {
        alert('Webcam permission unverified. Continuing with synthetic OMT broadcast test pattern.');
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      setUseCamera(false);
    }
  };

  // Mute audio calibration tone
  const toggleAudioTone = () => {
    if (isMuted) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setAudioCtx(ctx);
      setIsMuted(false);
    } else {
      if (audioCtx) {
        audioCtx.close();
        setAudioCtx(null);
      }
      setIsMuted(true);
    }
  };

  return (
    <div className={`bg-[#0F0F12] rounded border overflow-hidden font-mono space-y-0 transition-all ${
      pipeline.status === 'active' ? 'border-slate-800' : 'border-slate-800/60 opacity-75'
    }`}>
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Header Info */}
      <div className="bg-[#0A0A0B] px-3.5 py-2 flex items-center justify-between border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2 truncate">
          <span className={`w-2 h-2 rounded-full ${
            pipeline.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
          }`} />
          <span className="font-bold text-slate-100 uppercase tracking-tight text-[11px] truncate">
            {pipeline.name}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 uppercase">
            {pipeline.bridgeInterface}
          </span>
        </div>
      </div>

      {/* Real-Time Live Stream Viewport Canvas */}
      <div className="relative aspect-video bg-black overflow-hidden group">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover"
        />

        {/* Live Status Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 pointer-events-none">
          <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-widest uppercase shadow animate-pulse">
            ● BRIDGE LIVE
          </span>
          <div className="bg-[#0F0F12]/90 text-amber-400 font-mono text-[10px] px-2 py-0.5 rounded font-bold border border-slate-800">
            {pipeline.timecode}
          </div>
          {bridge?.mtu && bridge.mtu >= 9000 && (
            <div className="bg-indigo-950/90 text-indigo-300 text-[9px] px-2 py-0.5 rounded font-mono border border-indigo-800/80">
              MTU 9000
            </div>
          )}
        </div>

        {/* Protocol Conversion Flow Overlay */}
        <div className="absolute bottom-2.5 left-2.5 bg-[#0F0F12]/90 backdrop-blur-sm text-[10px] text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-800 flex items-center space-x-1.5 pointer-events-none">
          <span className="text-indigo-400 font-bold">{pipeline.ingestProtocol}</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-green-400 font-bold">{pipeline.egressProtocol}</span>
          <span className="text-slate-600">|</span>
          <span>{pipeline.resolution}</span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-300 font-bold">{(pipeline.bitrateKbps / 1000).toFixed(1)} Mbps</span>
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-[2px]">
          
          <button
            onClick={onTogglePause}
            className="p-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-full transition-transform hover:scale-110 cursor-pointer"
            title={isPaused ? 'Resume Processing Stream' : 'Pause Processing Stream'}
          >
            {isPaused ? <Play className="w-4 h-4 text-green-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={toggleAudioTone}
            className={`p-2 rounded-full backdrop-blur-md transition-transform hover:scale-110 cursor-pointer ${
              isMuted ? 'bg-slate-800/90 text-slate-300' : 'bg-indigo-600 text-white'
            }`}
            title={isMuted ? 'Unmute Audio Reference Tone' : 'Mute Tone'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-2 rounded-full backdrop-blur-md transition-transform hover:scale-110 cursor-pointer ${
              useCamera ? 'bg-green-600 text-white' : 'bg-slate-800/90 text-slate-300'
            }`}
            title={useCamera ? 'Return to Test Pattern' : 'Switch to Webcam'}
          >
            <Camera className="w-4 h-4" />
          </button>

          {pipeline.sdpManifest && onOpenSdpModal && (
            <button
              onClick={() => onOpenSdpModal(pipeline.sdpManifest!, pipeline.name)}
              className="p-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-full transition-transform hover:scale-110 cursor-pointer"
              title="Inspect SDP Manifest"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>

      {/* Audio Level & Bridge Routing Footer */}
      <div className="bg-[#0F0F12] p-3 space-y-2 border-t border-slate-800 text-[11px]">
        
        {/* Audio VU Meters */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>BRIDGE AUDIO PPM</span>
            <span>L: {pipeline.audioLevels[0]} dBFS | R: {pipeline.audioLevels[1]} dBFS</span>
          </div>

          <div className="w-full bg-[#0A0A0B] rounded-full h-1.5 overflow-hidden flex items-center p-0.5 border border-slate-800">
            <div 
              className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
              style={{ width: `${Math.max(5, Math.min(100, (pipeline.audioLevels[0] + 60) * 1.66))}%` }}
            />
          </div>
          <div className="w-full bg-[#0A0A0B] rounded-full h-1.5 overflow-hidden flex items-center p-0.5 border border-slate-800">
            <div 
              className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
              style={{ width: `${Math.max(5, Math.min(100, (pipeline.audioLevels[1] + 60) * 1.66))}%` }}
            />
          </div>
        </div>

        {/* Attached Bridge Slaves Info */}
        {bridge && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
            <span>Active Slaves: <strong className="text-indigo-300">{bridge.slaves.join(', ')}</strong></span>
            <span>Jitter: <strong className="text-amber-400">{pipeline.jitterMs} ms</strong></span>
          </div>
        )}

      </div>

    </div>
  );
};
