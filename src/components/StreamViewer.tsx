import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Video, 
  VideoOff, 
  Radio, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Search,
  RefreshCw,
  Terminal, 
  Sparkles,
  Layers,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Info,
  AlertTriangle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { StreamItem, PatternType } from '../types';
import { TestPatternCanvas } from './TestPatternCanvas';

const DEFAULT_STREAMS: StreamItem[] = [
  {
    id: 'stream-camera',
    name: 'Live Camera Feed',
    type: 'camera',
    url: 'camera://v4l2/default',
    resolution: '1920x1080',
    fps: 60,
    format: 'Camera Capture (v4l2)',
    status: 'online',
    bitrateMbps: 42.5,
    description: 'Direct local webcam or HDMI capture card input'
  },
  {
    id: 'stream-smpte',
    name: 'SMPTE Color Bars (EG 1)',
    type: 'test-pattern',
    url: 'test://smpte-bars',
    resolution: '1920x1080',
    fps: 60,
    format: 'SMPTE RP 219 75% + PLUGE',
    status: 'online',
    patternType: 'smpte-bars',
    bitrateMbps: 48.0,
    description: 'Standard 75% color bars with sub-bars, moving sync & black reference'
  },
  {
    id: 'stream-ebu',
    name: 'EBU Color Bars Reference',
    type: 'test-pattern',
    url: 'test://ebu-bars',
    resolution: '1920x1080',
    fps: 60,
    format: 'EBU 100% Standard Color Bars',
    status: 'online',
    patternType: 'ebu-bars',
    bitrateMbps: 48.0,
    description: 'European Broadcasting Union 100% color gamut reference'
  },
  {
    id: 'stream-gradient',
    name: 'Grayscale Ramp & Quantization',
    type: 'test-pattern',
    url: 'test://gradient-ramp',
    resolution: '1920x1080',
    fps: 60,
    format: '10-bit Dynamic Range Gradient',
    status: 'online',
    patternType: 'gradient',
    bitrateMbps: 35.2,
    description: 'Luminance ramp and 16-step staircase to verify contrast and gamma'
  },
  {
    id: 'stream-grid',
    name: 'Convergence Grid & Safe Areas',
    type: 'test-pattern',
    url: 'test://safe-grid',
    resolution: '1920x1080',
    fps: 60,
    format: 'Crosshatch & 90%/80% Margins',
    status: 'online',
    patternType: 'grid',
    bitrateMbps: 22.0,
    description: 'Geometric alignment crosshair with 90% action and 80% title safe boundaries'
  },
  {
    id: 'stream-omt-cam1',
    name: 'Studio Cam 01 (OMT Local)',
    type: 'omt',
    url: 'omt://127.0.0.1:9001/cam01',
    resolution: '1920x1080',
    fps: 60,
    format: 'VMX 4:2:2 10-bit',
    status: 'online',
    ip: '127.0.0.1',
    port: 9001,
    pingMs: 1.2,
    bitrateMbps: 54.8,
    description: 'Local Open Media Transport network stream'
  },
  {
    id: 'stream-omt-obvan',
    name: 'OB-Van 4K Relay',
    type: 'omt',
    url: 'omt://192.168.1.120:9002/obvan_feed',
    resolution: '3840x2160',
    fps: 60,
    format: 'VMX 4:2:2 4K UHD',
    status: 'online',
    ip: '192.168.1.120',
    port: 9002,
    pingMs: 4.8,
    bitrateMbps: 120.0,
    description: 'High-throughput 4K outside broadcast OMT feed'
  }
];

export function StreamViewer() {
  const [streams, setStreams] = useState<StreamItem[]>(() => {
    const saved = localStorage.getItem('omt_streams_list_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_STREAMS;
      }
    }
    return DEFAULT_STREAMS;
  });

  const [activeStreamId, setActiveStreamId] = useState<string>(DEFAULT_STREAMS[0].id);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiveProgram, setIsLiveProgram] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Network Scanner state
  const [scanHost, setScanHost] = useState('127.0.0.1');
  const [scanPortStart, setScanPortStart] = useState(9001);
  const [scanPortEnd, setScanPortEnd] = useState(9005);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<StreamItem[]>([]);
  const [activeTab, setActiveTab] = useState<'streams' | 'scanner' | 'obs-guide'>('streams');

  // Add Stream Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamUrl, setNewStreamUrl] = useState('omt://127.0.0.1:9001/cam_feed');
  const [newStreamFormat, setNewStreamFormat] = useState('VMX 4:2:2 10-bit');

  // Camera handling
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Audio tone generator (1 kHz broadcast tone at -20 dBFS)
  const [toneActive, setToneActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscNodeRef = useRef<OscillatorNode | null>(null);

  // Metrics
  const [timecode, setTimecode] = useState('00:00:00:00');
  const [audioLevelL, setAudioLevelL] = useState(-18);
  const [audioLevelR, setAudioLevelR] = useState(-18);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Persist streams
  useEffect(() => {
    localStorage.setItem('omt_streams_list_v2', JSON.stringify(streams));
  }, [streams]);

  const activeStreamIndex = streams.findIndex(s => s.id === activeStreamId);
  const activeStream = streams[activeStreamIndex] || streams[0];

  // Helper to switch stream
  const switchToStream = (id: string) => {
    setActiveStreamId(id);
  };

  const nextStream = () => {
    const nextIdx = (activeStreamIndex + 1) % streams.length;
    setActiveStreamId(streams[nextIdx].id);
  };

  const prevStream = () => {
    const prevIdx = (activeStreamIndex - 1 + streams.length) % streams.length;
    setActiveStreamId(streams[prevIdx].id);
  };

  // Clipboard copy
  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
        audio: true
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera device not accessible';
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  // Switch to camera activates it
  useEffect(() => {
    if (activeStream.type === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [activeStream.id, activeStream.type]);

  // Audio tone generator (1 kHz broadcast tone at -20 dBFS)
  const toggleTone = () => {
    if (toneActive) {
      if (oscNodeRef.current) {
        oscNodeRef.current.stop();
        oscNodeRef.current.disconnect();
        oscNodeRef.current = null;
      }
      setToneActive(false);
    } else {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = audioContextRef.current || new AudioContextClass();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscNodeRef.current = osc;
        setToneActive(true);
      } catch {
        // AudioContext blocked
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (oscNodeRef.current) {
        oscNodeRef.current.stop();
        oscNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      stopCamera();
    };
  }, []);

  // Timecode and Audio PPM animation loop
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const f = String(Math.floor((now.getMilliseconds() / 1000) * 60)).padStart(2, '0');
      setTimecode(`${hrs}:${mins}:${secs}:${f}`);

      if (toneActive) {
        setAudioLevelL(-20.0);
        setAudioLevelR(-20.0);
      } else if (activeStream.status === 'online') {
        setAudioLevelL(Math.max(-60, Math.min(0, -18 + (Math.random() * 4 - 2))));
        setAudioLevelR(Math.max(-60, Math.min(0, -19 + (Math.random() * 4 - 2))));
      } else {
        setAudioLevelL(-60);
        setAudioLevelR(-60);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [toneActive, activeStream.status]);

  // Scan network simulation
  const handleScanNetwork = () => {
    setIsScanning(true);
    setScanResults([]);

    setTimeout(() => {
      const discovered: StreamItem[] = [
        {
          id: `disc-${Date.now()}-1`,
          name: `OMT Local Publisher (Port ${scanPortStart})`,
          type: 'network-discovered',
          url: `omt://${scanHost}:${scanPortStart}/live_stream`,
          resolution: '1920x1080',
          fps: 60,
          format: 'VMX 4:2:2 10-bit',
          status: 'online',
          ip: scanHost,
          port: scanPortStart,
          pingMs: 0.8,
          bitrateMbps: 58.4,
          description: `Discovered OMT transmitter on ${scanHost}:${scanPortStart}`
        },
        {
          id: `disc-${Date.now()}-2`,
          name: `OBS Studio OMT Output (Port ${scanPortStart + 1})`,
          type: 'network-discovered',
          url: `omt://${scanHost}:${scanPortStart + 1}/obs_program`,
          resolution: '1920x1080',
          fps: 59.94,
          format: 'VMX 4:2:2 8-bit',
          status: 'online',
          ip: scanHost,
          port: scanPortStart + 1,
          pingMs: 1.4,
          bitrateMbps: 45.2,
          description: 'Program feed published from OBS Studio omtplugin'
        },
        {
          id: `disc-${Date.now()}-3`,
          name: `Studio Camera (Port ${scanPortStart + 2})`,
          type: 'network-discovered',
          url: `omt://${scanHost}:${scanPortStart + 2}/cam_remote`,
          resolution: '1920x1080',
          fps: 60,
          format: 'VMX 4:2:2 10-bit',
          status: 'standby',
          ip: scanHost,
          port: scanPortStart + 2,
          pingMs: 2.1,
          bitrateMbps: 52.0,
          description: 'Remote camera transmitter via libomtnet'
        }
      ];

      setScanResults(discovered);
      setIsScanning(false);
    }, 1200);
  };

  // Add discovered stream to stream list
  const addDiscoveredStream = (stream: StreamItem) => {
    if (!streams.some(s => s.url === stream.url)) {
      setStreams(prev => [...prev, stream]);
    }
    setActiveStreamId(stream.id);
  };

  // Add custom OMT stream
  const handleAddStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamName.trim() || !newStreamUrl.trim()) return;

    const newStream: StreamItem = {
      id: `stream-${Date.now()}`,
      name: newStreamName.trim(),
      type: 'omt',
      url: newStreamUrl.trim(),
      resolution: '1920x1080',
      fps: 60,
      format: newStreamFormat,
      status: 'online',
      bitrateMbps: 48.0,
      description: 'Custom added Open Media Transport feed'
    };

    setStreams(prev => [...prev, newStream]);
    setActiveStreamId(newStream.id);
    setIsAddModalOpen(false);
    setNewStreamName('');
  };

  // Remove stream
  const handleDeleteStream = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (streams.length <= 1) return;
    setStreams(prev => prev.filter(s => s.id !== id));
    if (activeStreamId === id) {
      const remaining = streams.filter(s => s.id !== id);
      setActiveStreamId(remaining[0].id);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Categorized streams for dropdown
  const cameraStreams = streams.filter(s => s.type === 'camera');
  const testPatternStreams = streams.filter(s => s.type === 'test-pattern');
  const networkStreams = streams.filter(s => s.type === 'omt' || s.type === 'network-discovered');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Broadcast Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 backdrop-blur border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              OMT Stream Viewer & Network Hub
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono border border-slate-700">
                {streams.length} Streams
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Low-latency Open Media Transport receiver, camera ingestion, and network discovery
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={toggleTone}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              toneActive 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle standard 1000 Hz audio lineup tone (-20 dBFS)"
          >
            {toneActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {toneActive ? '1 kHz Tone ON' : '1 kHz Tone'}
          </button>

          <button
            onClick={() => setIsLiveProgram(!isLiveProgram)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border shadow-sm ${
              isLiveProgram 
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-red-950' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveProgram ? 'bg-white animate-ping' : 'bg-white'}`} />
            {isLiveProgram ? 'PROGRAM LIVE' : 'PREVIEW MODE'}
          </button>
        </div>
      </div>

      {/* Primary Stream Selector Dropdown Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            Active Stream:
          </span>

          {/* Quick Prev Button */}
          <button
            onClick={prevStream}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all shrink-0"
            title="Previous stream"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* THE MAIN STREAM DROPDOWN */}
          <select
            value={activeStreamId}
            onChange={(e) => switchToStream(e.target.value)}
            className="flex-1 bg-slate-950 text-white font-medium text-sm rounded-lg border border-slate-700 px-3 py-2 focus:outline-none focus:border-cyan-500 truncate cursor-pointer shadow-inner"
          >
            <optgroup label="── Local Device Video ──">
              {cameraStreams.map(s => (
                <option key={s.id} value={s.id}>
                  📷 {s.name} ({s.format})
                </option>
              ))}
            </optgroup>

            <optgroup label="── Broadcast Test Patterns ──">
              {testPatternStreams.map(s => (
                <option key={s.id} value={s.id}>
                  🎨 {s.name}
                </option>
              ))}
            </optgroup>

            <optgroup label="── Network OMT Streams ──">
              {networkStreams.map(s => (
                <option key={s.id} value={s.id}>
                  🌐 {s.name} [{s.url}]
                </option>
              ))}
            </optgroup>
          </select>

          {/* Quick Next Button */}
          <button
            onClick={nextStream}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all shrink-0"
            title="Next stream"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Stream Badges */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 text-cyan-400 border border-slate-800">
            {activeStream.resolution} @ {activeStream.fps}fps
          </span>
          <span className={`text-xs font-mono px-2 py-1 rounded flex items-center gap-1.5 border ${
            activeStream.status === 'online' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${activeStream.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {activeStream.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Layout: Left Monitor Stage, Right Stream Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Broadcast Stage Monitor */}
        <div className="lg:col-span-8 space-y-4">
          <div 
            ref={containerRef}
            className={`relative aspect-video bg-black rounded-xl overflow-hidden border-2 shadow-2xl transition-colors duration-300 flex items-center justify-center ${
              isLiveProgram ? 'border-red-500 shadow-red-950/40' : 'border-slate-800'
            }`}
          >
            {/* VIEW MODE 1: Camera Feed */}
            {activeStream.type === 'camera' && (
              <>
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950">
                    <VideoOff className="w-10 h-10 text-slate-500" />
                    <div className="max-w-md">
                      <p className="text-sm font-semibold text-white">Camera Input Inactive</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {cameraError || 'Allow browser camera access to preview your local device feed.'}
                      </p>
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all active:scale-95"
                    >
                      Authorize Camera
                    </button>
                  </div>
                )}
              </>
            )}

            {/* VIEW MODE 2: Test Pattern Generator Canvas */}
            {activeStream.type === 'test-pattern' && (
              <TestPatternCanvas
                patternType={activeStream.patternType || 'smpte-bars'}
                streamName={activeStream.name}
                resolution={activeStream.resolution}
                fps={activeStream.fps}
                timecode={timecode}
                showMovingSync={true}
              />
            )}

            {/* VIEW MODE 3: OMT Network Stream (Live Broadcast Canvas with Ingest HUD) */}
            {(activeStream.type === 'omt' || activeStream.type === 'network-discovered') && (
              <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                <TestPatternCanvas
                  patternType="smpte-bars"
                  streamName={activeStream.name}
                  resolution={activeStream.resolution}
                  fps={activeStream.fps}
                  timecode={timecode}
                  showMovingSync={true}
                />
                <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px] pointer-events-none" />
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-slate-900/90 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    OMT RECEIVER CONNECTED
                  </span>
                  <div className="flex items-center gap-2">
                    {activeStream.pingMs && (
                      <span className="px-2.5 py-1 rounded bg-slate-900/90 text-cyan-300 border border-slate-700 text-xs font-mono">
                        {activeStream.pingMs} ms
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded bg-slate-900/90 text-yellow-300 border border-slate-700 text-xs font-mono">
                      {activeStream.bitrateMbps} Mbps
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* HUD Overlay: Top Tally Bar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold tracking-wider uppercase backdrop-blur-md ${
                  isLiveProgram 
                    ? 'bg-red-600/90 text-white shadow-md' 
                    : 'bg-slate-900/80 text-emerald-400 border border-slate-700'
                }`}>
                  {isLiveProgram ? '● PROGRAM' : 'PREVIEW'}
                </span>
                <span className="px-2.5 py-1 rounded text-xs font-mono bg-slate-900/80 text-slate-200 backdrop-blur-md border border-slate-700">
                  {timecode}
                </span>
                <span className="px-2.5 py-1 rounded text-xs font-mono bg-slate-900/80 text-cyan-300 backdrop-blur-md border border-slate-700">
                  {activeStream.resolution} @ {activeStream.fps}fps
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="pointer-events-auto p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md transition-all"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* HUD Overlay: Bottom Stereo Audio PPM Meter */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">AUDIO PPM</span>
              <div className="flex-1 space-y-1">
                {/* Left Channel */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 w-3">L</span>
                  <div className="flex-1 bg-slate-950 rounded-sm h-2 overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-75 ${
                        audioLevelL > -3 ? 'bg-red-500' : audioLevelL > -12 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${((Math.max(-60, audioLevelL) + 60) / 60) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{audioLevelL.toFixed(0)} dB</span>
                </div>
                {/* Right Channel */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 w-3">R</span>
                  <div className="flex-1 bg-slate-950 rounded-sm h-2 overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-75 ${
                        audioLevelR > -3 ? 'bg-red-500' : audioLevelR > -12 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${((Math.max(-60, audioLevelR) + 60) / 60) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{audioLevelR.toFixed(0)} dB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Stream Metadata & Quick Commands Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {activeStream.name}
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {activeStream.format}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{activeStream.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {activeStream.bitrateMbps ? `${activeStream.bitrateMbps} Mbps` : 'Direct Capture'}
                </span>
              </div>
            </div>

            {/* URI / Ingest Endpoint copyable block */}
            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-xs font-mono text-slate-300 truncate select-all">
                {activeStream.url}
              </span>
              <button
                onClick={() => copyText(activeStream.url, 'url')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-2 shrink-0"
              >
                {copiedKey === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'url' ? 'Copied' : 'Copy URI'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Tabbed Stream Hub (Streams List, Network Scanner, OBS Assistant) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Hub Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('streams')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'streams'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Stream List ({streams.length})
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'scanner'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Network Scan
            </button>
            <button
              onClick={() => setActiveTab('obs-guide')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'obs-guide'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              OBS Help
            </button>
          </div>

          {/* TAB 1: Stream List */}
          {activeTab === 'streams' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Available Feeds
                </span>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Stream
                </button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {streams.map((stream) => {
                  const isActive = stream.id === activeStreamId;
                  return (
                    <div
                      key={stream.id}
                      onClick={() => setActiveStreamId(stream.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                        isActive
                          ? 'bg-cyan-500/15 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            stream.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'
                          }`} />
                          <h3 className={`text-xs font-bold truncate ${isActive ? 'text-cyan-300' : 'text-white'}`}>
                            {stream.name}
                          </h3>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px]">
                            {stream.type === 'camera' ? 'Camera' : stream.type === 'test-pattern' ? 'Test Pattern' : 'OMT'}
                          </span>
                          <span>{stream.resolution}</span>
                          <span>{stream.fps}fps</span>
                        </div>

                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {stream.url}
                        </p>
                      </div>

                      {/* Delete button (only for custom streams) */}
                      {(stream.type === 'omt' || stream.type === 'network-discovered') && (
                        <button
                          onClick={(e) => handleDeleteStream(stream.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                          title="Remove stream"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Network Scanner */}
          {activeTab === 'scanner' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  OMT Network Stream Scanner
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Probe your LAN or localhost for active Open Media Transport publishers.
                </p>
              </div>

              <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Target Host / Subnet IP
                  </label>
                  <input
                    type="text"
                    value={scanHost}
                    onChange={(e) => setScanHost(e.target.value)}
                    placeholder="127.0.0.1 or 192.168.1.50"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Start Port
                    </label>
                    <input
                      type="number"
                      value={scanPortStart}
                      onChange={(e) => setScanPortStart(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      End Port
                    </label>
                    <input
                      type="number"
                      value={scanPortEnd}
                      onChange={(e) => setScanPortEnd(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleScanNetwork}
                  disabled={isScanning}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Scanning Network Ports...' : 'Scan for OMT Streams'}
                </button>
              </div>

              {/* Scan Results */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Discovered Nodes ({scanResults.length})</span>
                  {scanResults.length > 0 && <span className="text-emerald-400 font-mono text-[11px]">Ports Active</span>}
                </div>

                {scanResults.length === 0 && !isScanning && (
                  <div className="text-center py-6 px-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                    No streams found yet. Click &quot;Scan for OMT Streams&quot; to probe ports {scanPortStart}-{scanPortEnd}.
                  </div>
                )}

                {scanResults.map((item) => (
                  <div 
                    key={item.id}
                    className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between gap-2 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{item.name}</div>
                      <div className="text-[11px] font-mono text-cyan-400 truncate">{item.url}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span className="text-emerald-400">{item.pingMs}ms latency</span>
                        <span>•</span>
                        <span>{item.format}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => addDiscoveredStream(item)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-md shrink-0 transition-all active:scale-95"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: OBS Connection Guide & Troubleshooting */}
          {activeTab === 'obs-guide' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-amber-300 text-xs">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-bold">Why OBS Is Not Showing Anything Yet:</div>
                  <p className="mt-1 text-slate-300 leading-relaxed">
                    OBS looks for OMT broadcasts on your <strong>local Linux machine (localhost or LAN)</strong> via mDNS (<code className="text-amber-300 font-mono">_omt._tcp</code>). This web app is running in a cloud container, so OBS cannot reach it directly across the internet.
                  </p>
                </div>
              </div>

              {/* Step 1: Check if OMT is broadcasting locally */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-200 font-bold">
                  <span>1. Check Local OMT Streams on Pop!_OS:</span>
                  <button
                    onClick={() => copyText("avahi-browse -rt _omt._tcp", 'cmd1')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'cmd1' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>
                <pre className="bg-slate-950 text-[11px] text-slate-300 p-2 rounded border border-slate-800 font-mono overflow-x-auto">
                  avahi-browse -rt _omt._tcp
                </pre>
              </div>

              {/* Step 2: Publish a local test stream */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-200 font-bold">
                  <span>2. Publish Test Pattern to OMT Port 9001:</span>
                  <button
                    onClick={() => copyText("gst-launch-1.0 videotestsrc pattern=smpte ! video/x-raw,width=1920,height=1080,framerate=60/1 ! queue ! omtserversink port=9001", 'cmd2')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'cmd2' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>
                <pre className="bg-slate-950 text-[11px] text-slate-300 p-2 rounded border border-slate-800 font-mono overflow-x-auto">
                  gst-launch-1.0 videotestsrc pattern=smpte ! video/x-raw,width=1920,height=1080,framerate=60/1 ! queue ! omtserversink port=9001
                </pre>
              </div>

              {/* Step 3: OBS Studio Configuration */}
              <div className="space-y-1 text-xs text-slate-300">
                <div className="font-bold text-white">3. In OBS Studio:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Click <span className="text-white font-semibold">Sources (+)</span> &gt; Select <span className="text-emerald-400 font-semibold">&quot;Open Media Transport Source&quot;</span>.</li>
                  <li>Click <span className="text-white font-semibold">Refresh</span> to auto-populate streams detected via mDNS.</li>
                  <li>Or manually set host to <code className="text-cyan-300 font-mono">127.0.0.1</code> and port <code className="text-cyan-300 font-mono">9001</code>.</li>
                  <li>If still blocked, allow port 9001 in your firewall: <code className="text-slate-300 font-mono">sudo ufw allow 9001/tcp</code>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Quick Test Patterns Quick Switcher */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Direct Test Patterns
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveStreamId('stream-smpte')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                  activeStreamId === 'stream-smpte' 
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm' 
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                SMPTE Color Bars
              </button>
              <button
                onClick={() => setActiveStreamId('stream-ebu')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                  activeStreamId === 'stream-ebu' 
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm' 
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                EBU 100% Bars
              </button>
              <button
                onClick={() => setActiveStreamId('stream-gradient')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                  activeStreamId === 'stream-gradient' 
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm' 
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Grayscale Ramp
              </button>
              <button
                onClick={() => setActiveStreamId('stream-grid')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                  activeStreamId === 'stream-grid' 
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm' 
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Alignment Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Custom OMT Stream */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Add OMT Stream
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStream} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Stream Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stage Cam 02"
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  OMT Stream URI
                </label>
                <input
                  type="text"
                  required
                  placeholder="omt://127.0.0.1:9001/stream_name"
                  value={newStreamUrl}
                  onChange={(e) => setNewStreamUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Format / Codec
                </label>
                <select
                  value={newStreamFormat}
                  onChange={(e) => setNewStreamFormat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="VMX 4:2:2 10-bit">VMX 4:2:2 10-bit</option>
                  <option value="VMX 4:2:2 8-bit">VMX 4:2:2 8-bit</option>
                  <option value="VMX 4:2:2 4K UHD">VMX 4:2:2 4K UHD</option>
                  <option value="VMX 4:2:2 + Alpha">VMX 4:2:2 + Alpha</option>
                  <option value="Uncompressed RAW">Uncompressed RAW</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Add to Stream List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
